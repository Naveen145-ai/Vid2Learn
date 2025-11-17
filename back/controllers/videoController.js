const ffmpeg = require("fluent-ffmpeg");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/videoModel");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Extract audio to temp file
const extractAudio = (inputPath) =>
  new Promise((resolve, reject) => {
    const output = path.join(__dirname, "../uploads", `${Date.now()}_audio.mp3`);
    ffmpeg(inputPath)
      .output(output)
      .audioCodec("libmp3lame")
      .on("end", () => resolve(output))
      .on("error", reject)
      .run();
  });

// Helper to extract JSON from messy text
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

exports.extractAudioAndGenerateNotes = async (req, res) => {
  console.log("📩 Received video upload request...");

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No video file uploaded"
    });
  }

  const localVideo = req.file.path;

  try {
    // Upload video to Cloudinary
    const videoResult = await cloudinary.uploader.upload(localVideo, {
      resource_type: "video",
      folder: "videos"
    });

    console.log("☁️ Video uploaded:", videoResult.secure_url);

    // Extract audio
    const audioPath = await extractAudio(localVideo);

    const audioResult = await cloudinary.uploader.upload(audioPath, {
      resource_type: "auto",
      folder: "audios"
    });

    console.log("🎧 Audio uploaded:", audioResult.secure_url);

    // AI prompt
    const prompt = `
You are a learning assistant. 
Transcribe and summarize the audio from this link: ${audioResult.secure_url}

Return ONLY clean JSON:
{
  "transcript": "",
  "summary": "",
  "keyConcepts": [],
  "quiz": []
}
`;

    // --- OLLAMA CALL (stdin method) ---
    const model = "deepseek-r1:1.5b";

    const ollama = spawn("ollama", ["run", model]);

    let output = "";

    ollama.stdout.on("data", (data) => {
      output += data.toString();
    });

    ollama.stderr.on("data", (err) =>
      console.error("Ollama error:", err.toString())
    );

    // Send the prompt into ollama
    ollama.stdin.write(prompt);
    ollama.stdin.end();

    // When ollama completes
    ollama.on("close", async () => {
      try {
        const cleaned = output.replace(/[\x00-\x1F]/g, "");

        const jsonString = extractJson(cleaned);

        if (!jsonString) {
          throw new Error("AI did not return valid JSON");
        }

        const parsed = JSON.parse(jsonString);

        // SAVE to MongoDB
        const saved = await Video.create({
          title: req.file.originalname,
          videoUrl: videoResult.secure_url,
          audioUrl: audioResult.secure_url,
          transcript: parsed.transcript,
          summary: parsed.summary,
          keyConcepts: parsed.keyConcepts,
          quiz: parsed.quiz
        });

        // Clean temp files
        fs.unlinkSync(localVideo);
        fs.unlinkSync(audioPath);

        console.log("✅ Saved video data!");
        res.json({ success: true, video: saved });

      } catch (e) {
        console.error("❌ Parse error:", e);
        res.status(500).json({
          message: "AI parse failed",
          error: e.message
        });
      }
    });

  } catch (err) {
    console.error("🔥 Upload or extraction failed:", err);
    res.status(500).json({
      message: "Upload failed",
      error: err.message
    });
  }
};
