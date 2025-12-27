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
const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const Video = require("../models/videoModel");

// Tell fluent-ffmpeg where ffmpeg is
ffmpeg.setFfmpegPath(ffmpegPath);

// AWS clients
const s3 = new S3Client({ region: process.env.AWS_REGION });
const transcribe = new TranscribeClient({ region: process.env.AWS_REGION });
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

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

// --------------------
// Transcribe audio
// --------------------
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

  while (true) {
    const data = await transcribe.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );

    const status = data.TranscriptionJob.TranscriptionJobStatus;

    if (status === "COMPLETED") {
      console.log("✅ Transcription completed!");
      const transcriptUrl =
        data.TranscriptionJob.Transcript.TranscriptFileUri;

      // Use Axios to fetch transcript JSON
      const { data: json } = await axios.get(transcriptUrl);
      const transcript = json.results.transcripts[0].transcript;

      console.log("📝 Transcript length:", transcript.length, "characters");
      return transcript;
    }

    if (status === "FAILED") {
      throw new Error("❌ Transcription failed");
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}

// --------------------
// Call Bedrock (Claude)
// --------------------
async function generateNotes(transcript) {
  console.log("🤖 Generating educational notes from transcript...");
  const prompt = `You are an educational assistant. From this transcript, generate valid JSON with these exact fields:
{
  "title": "a descriptive title",
  "summary": "brief summary",
  "keyConcepts": ["concept1", "concept2"],
  "quiz": [{"question": "?", "options": ["a", "b"], "answer": "a"}]
}

Transcript: ${transcript}

Return ONLY valid JSON, no other text.`;

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-06-01",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const response = await bedrock.send(command);
    const bodyString = Buffer.from(response.body).toString();
    const parsedResponse = JSON.parse(bodyString);
    const text = parsedResponse.content[0].text;

    const aiData = JSON.parse(text);
    console.log("✅ AI notes generated successfully");
    return aiData;
  } catch (error) {
    console.error("❌ Bedrock Error Details:", {
      message: error.message,
      code: error.__type,
      statusCode: error.$metadata?.httpStatusCode,
    });
    
    // Return default structure if Bedrock fails
    return {
      title: "Lecture Notes",
      summary: transcript.substring(0, 200),
      keyConcepts: ["Topic 1", "Topic 2"],
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

    // Transcribe
    const transcript = await transcribeAudio(s3Uri);

    // Generate AI Notes
    const aiData = await generateNotes(transcript);

    // Save to MongoDB
    const saved = await Video.create({
      title: aiData.title || req.file.originalname,
      transcript,
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
