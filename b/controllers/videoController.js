// controllers/videoController.js

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static"); // ensures ffmpeg works
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const axios = require("axios"); // <-- Use Axios instead of fetch

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} = require("@aws-sdk/client-transcribe");
const Groq = require("groq-sdk");

const Video = require("../models/videoModel");

// Tell fluent-ffmpeg where ffmpeg is
ffmpeg.setFfmpegPath(ffmpegPath);

// AWS & Groq clients
const s3 = new S3Client({ region: process.env.AWS_REGION });
const transcribe = new TranscribeClient({ region: process.env.AWS_REGION });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --------------------
// Extract audio
// --------------------
const extractAudio = (videoPath) =>
  new Promise((resolve, reject) => {
    console.log("🔊 Extracting audio from video...");
    const audioPath = path.join(
      __dirname,
      "../uploads",
      `${Date.now()}.mp3`
    );

    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec("libmp3lame")
      .on("end", () => {
        console.log("✅ Audio extracted:", audioPath);
        resolve(audioPath);
      })
      .on("error", (err) => reject(err))
      .run();
  });

// --------------------
// Upload to S3
// --------------------
async function uploadToS3(filePath) {
  console.log("☁️ Uploading audio to S3...");
  const fileStream = fs.createReadStream(filePath);
  const key = `audio/${uuid()}.mp3`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: "audio/mpeg",
    })
  );

  const s3Uri = `s3://${process.env.S3_BUCKET_NAME}/${key}`;
  console.log("✅ Audio uploaded to S3:", s3Uri);
  return s3Uri;
}

async function uploadVideoToS3(videoPath) {
  console.log("☁️ Uploading video to S3...");
  const fileStream = fs.createReadStream(videoPath);
  const key = `videos/${uuid()}.mp4`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: "video/mp4",
    })
  );

  const s3Uri = `s3://${process.env.S3_BUCKET_NAME}/${key}`;
  console.log("✅ Video uploaded to S3:", s3Uri);
  return s3Uri;
}

// --------------------
// Transcribe audio with retry logic
// --------------------
async function fetchTranscriptWithRetry(transcriptUrl, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 Fetching transcript (attempt ${attempt}/${maxRetries})...`);
      const { data: json } = await axios.get(transcriptUrl, {
        timeout: 30000, // 30 second timeout
      });
      const transcript = json.results.transcripts[0].transcript;
      console.log("📝 Transcript length:", transcript.length, "characters");
      return transcript;
    } catch (error) {
      console.warn(
        `⚠️ Attempt ${attempt} failed:`,
        error.code || error.message
      );

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to fetch transcript after ${maxRetries} attempts: ${error.message}`
        );
      }

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function transcribeAudio(s3Uri) {
  console.log("🎤 Starting AWS Transcribe job...");
  const jobName = `job-${uuid()}`;

  await transcribe.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: "en-US",
      MediaFormat: "mp3",
      Media: { MediaFileUri: s3Uri },
    })
  );

  console.log("⏳ Waiting for transcription to complete...");

  let pollCount = 0;
  const maxPolls = 240; // 20 minutes max (240 * 5s)

  while (pollCount < maxPolls) {
    const data = await transcribe.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );

    const status = data.TranscriptionJob.TranscriptionJobStatus;

    if (status === "COMPLETED") {
      console.log("✅ Transcription completed!");
      const transcriptUrl =
        data.TranscriptionJob.Transcript.TranscriptFileUri;

      // Fetch transcript with retry logic
      const transcript = await fetchTranscriptWithRetry(transcriptUrl);
      return transcript;
    }

    if (status === "FAILED") {
      throw new Error(
        `❌ Transcription failed: ${data.TranscriptionJob.FailureReason || "Unknown reason"}`
      );
    }

    pollCount++;
    console.log(
      `Status: ${status} (${pollCount}/${maxPolls}) - next check in 5s...`
    );
    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error("Transcription polling timeout - took longer than 20 minutes");
}

// --------------------
// Clean up transcript for better readability
// --------------------
async function improveTranscript(transcript) {
  console.log("🔧 Improving transcript grammar and punctuation...");
  const cleanupPrompt = `You are an expert English editor. Fix the grammar, punctuation, and capitalization in this auto-generated transcript while preserving the original meaning and content exactly:

Transcript:
${transcript}

Return ONLY the cleaned-up transcript, nothing else.`;

  try {
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: cleanupPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      temperature: 0.1,
    });

    const cleanedTranscript = message.choices[0].message.content || transcript;
    console.log("✅ Transcript improved");
    return cleanedTranscript;
  } catch (error) {
    console.warn("⚠️ Transcript improvement skipped:", error.message);
    return transcript; // Return original if improvement fails
  }
}

// --------------------
// Call Bedrock (Claude)
// --------------------
async function generateNotes(transcript) {
  console.log("🤖 Generating educational notes from transcript...");
  const prompt = `You are an expert educational assistant. From the transcript below, extract exactly 5 key concepts with concise 2-3 line definitions and generate a quiz.

Return ONLY this JSON structure:
{
  "title": "Descriptive title (3-5 words)",
  "summary": "Concise 1-2 sentence overview of the content",
  "keyConcepts": [
    {"topic": "Concept Name", "definition": "2-3 line explanation of this concept from the transcript"},
    {"topic": "Concept Name", "definition": "2-3 line explanation"},
    {"topic": "Concept Name", "definition": "2-3 line explanation"},
    {"topic": "Concept Name", "definition": "2-3 line explanation"},
    {"topic": "Concept Name", "definition": "2-3 line explanation"}
  ],
  "quiz": [
    {"question": "Multiple choice question?", "options": ["Option A", "Option B", "Option C"], "answer": "Option A"},
    {"question": "Another question?", "options": ["Option A", "Option B", "Option C"], "answer": "Option B"}
  ]
}

REQUIREMENTS:
- Extract EXACTLY 5 unique key concepts that are most important from the transcript.
- Each definition must be 2-3 concise sentences, drawn from the transcript content.
- Quiz should have 2-3 questions based on the concepts discussed.
- Return ONLY raw JSON, no markdown fences, no explanations.
- Do not include any text outside this JSON object.

Transcript:
${transcript}`;

  // Robustly extract JSON even if the model wraps it in code fences or extra text
  function parseJsonFromText(text) {
    // Try direct parse first
    try {
      return JSON.parse(text);
    } catch (_) {}

    // Extract from fenced code block ```json ... ```
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      const candidate = fenced[1].trim();
      try {
        return JSON.parse(candidate);
      } catch (_) {}
    }

    // Extract substring between first { and last }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1).trim();
      try {
        return JSON.parse(candidate);
      } catch (_) {}
    }

    throw new Error("LLM response was not valid JSON");
  }

  try {
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      // If supported, ask Groq for strict JSON output
      // Some providers accept response_format: { type: "json_object" }
      // This call will be ignored if the model doesn't support it
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const text = message.choices[0].message.content || "";
    const aiData = parseJsonFromText(text);
    console.log("✅ AI notes generated successfully");
    return aiData;
  } catch (error) {
    console.error("❌ Groq Error:", error.message);
    // Helpful debug of original response (truncated)
    if (error && error.stack) {
      console.error("Stack:", error.stack.split("\n")[0]);
    }
    // Provide a safe fallback structure
    
    // Return default structure if Groq fails
    return {
      title: "Lecture Notes",
      summary: transcript.substring(0, 200),
      keyConcepts: [
        { topic: "Topic 1", definition: "Key information about the first concept" },
        { topic: "Topic 2", definition: "Key information about the second concept" },
        { topic: "Topic 3", definition: "Key information about the third concept" },
      ],
      quiz: [{ question: "What was discussed?", options: ["Option A", "Option B"], answer: "Option A" }],
    };
  }
}

// --------------------
// Main controller
// --------------------
exports.extractAudioAndGenerateNotes = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No video file uploaded" });
    }

    console.log("📩 Received video upload:", req.file.originalname);
    const videoPath = req.file.path;

    // Extract audio
    const audioPath = await extractAudio(videoPath);

    // Upload audio to S3
    const s3Uri = await uploadToS3(audioPath);
    
    // Upload video to S3
    const videoS3Uri = await uploadVideoToS3(videoPath);

    // Transcribe
    const transcript = await transcribeAudio(s3Uri);

    // Improve transcript grammar
    const cleanTranscript = await improveTranscript(transcript);

    // Generate AI Notes
    const aiData = await generateNotes(cleanTranscript);

    // Save to MongoDB
    const saved = await Video.create({
      title: aiData.title || req.file.originalname,
      videoUrl: videoS3Uri,
      audioUrl: s3Uri,
      transcript: cleanTranscript,
      summary: aiData.summary || "",
      keyConcepts: aiData.keyConcepts || [],
      quiz: aiData.quiz || [],
    });

    // Cleanup temp files
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);

    console.log("💾 Video data saved successfully!");
    res.json({ success: true, video: saved });
  } catch (err) {
    console.error("❌ Error processing video:", err);
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Test Google API
// --------------------
exports.testGoogleAPI = async (req, res) => {
  try {
    console.log("🧪 Testing Groq API...");
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Say hello in one word",
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const text = message.choices[0].message.content;
    
    console.log("✅ Groq API is working!");
    res.json({ 
      success: true, 
      message: "Groq API is working correctly",
      response: text
    });
  } catch (error) {
    console.error("❌ Groq Test Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: "Check if your Groq API key is valid"
    });
  }
};
