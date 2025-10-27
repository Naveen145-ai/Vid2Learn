const ffmpeg = require("fluent-ffmpeg");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/videoModel");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Extract audio to temp file
const extractAudio = (inputPath) => new Promise((resolve, reject) => {
  const output = path.join(__dirname, "../uploads", `${Date.now()}_audio.mp3`);
  ffmpeg(inputPath)
    .output(output)
    .audioCodec("libmp3lame")
    .on("end", () => resolve(output))
    .on("error", reject)
    .run();
});

exports.extractAudioAndGenerateNotes = async (req, res) => {
  console.log("📩 Received video upload request...");

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No video file uploaded" });
  }

  const localVideo = req.file.path;

  try {
    // Upload video to Cloudinary
    const videoResult = await cloudinary.uploader.upload(localVideo, {
      resource_type: "video",
      folder: "videos",
    });

    console.log("☁️ Video uploaded:", videoResult.secure_url);

    // Extract audio
    const audioPath = await extractAudio(localVideo);
    const audioResult = await cloudinary.uploader.upload(audioPath, {
      resource_type: "auto",
      folder: "audios",
    });

    console.log("🎧 Audio uploaded:", audioResult.secure_url);

    // Ollama AI request
    const prompt = `
      You are a learning assistant. Transcribe and summarize this audio:
      ${audioResult.secure_url}
      Return JSON with keys: transcript, summary, keyConcepts, quiz
    `;

    const ollama = spawn("ollama", ["run", "deepseek-r1:8b", "--prompt", prompt]);

    let output = "";
    ollama.stdout.on("data", (d) => (output += d.toString()));
    ollama.stderr.on("data", (err) => console.error("Ollama error:", err.toString()));

    ollama.on("close", async () => {
      try {
        const parsed = JSON.parse(output);

        const saved = await Video.create({
          title: req.file.originalname,
          videoUrl: videoResult.secure_url,
          audioUrl: audioResult.secure_url,
          transcript: parsed.transcript,
          summary: parsed.summary,
          keyConcepts: parsed.keyConcepts,
          quiz: parsed.quiz,
        });

        fs.unlinkSync(localVideo);
        fs.unlinkSync(audioPath);

        console.log("✅ Saved video data!");
        res.json({ success: true, video: saved });
      } catch (e) {
        console.error("❌ AI output parse failed:", e.message);
        res.status(500).json({ message: "AI parsing failed", error: e.message });
      }
    });
  } catch (err) {
    console.error("🔥 Upload or extraction failed:", err.message);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
