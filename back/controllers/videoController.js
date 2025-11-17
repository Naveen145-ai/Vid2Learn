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

// Helper to extract JSON from mixed text
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

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

    // AI prompt
    const prompt = `
You are a learning assistant. 
Transcribe and summarize the audio from this link: ${audioResult.secure_url}

Return clean JSON:
{
  "transcript": "",
  "summary": "",
  "keyConcepts": [],
  "quiz": []
}
`;

    // Use only 1.5B (or 5B if installed)
    const ollama = spawn("ollama", ["run", "deepseek-r1:1.5b"]);

    let output = "";

    // Collect response
    ollama.stdout.on("data", (d) => {
      output += d.toString();
    });

    // Errors
    ollama.stderr.on("data", (err) => {
      console.error("Ollama error:", err.toString());
    });

    // Send prompt
    ollama.stdin.write(prompt);
    ollama.stdin.end();

    // Finished
    ollama.on("close", async () => {
      try {
        // Remove hidden chars
        const cleaned = output.replace(/[\x00-\x1F]/g, "");

        // Extract pure JSON part
        const jsonString = extractJson(cleaned);

        if (!jsonString) {
          throw new Error("No valid JSON found from AI");
        }

        const parsed = JSON.parse(jsonString);

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
        console.error("❌ AI output parse failed:", e);
        res.status(500).json({ message: "AI parsing failed", error: e.message });
      }
    });

  } catch (err) {
    console.error("🔥 Upload or extraction failed:", err.message);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
