const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const cloudinary = require("../config/cloudinary"); // your Cloudinary setup
const Video = require("../models/videoModel");
const { execFile } = require("child_process");

// Helper: transcribe audio using Ollama CLI
const transcribeWithOllama = async (audioPath) => {
  return new Promise((resolve, reject) => {
    execFile(
      "ollama",
      ["run", "dimavz/whisper-tiny", "--input", fs.readFileSync(audioPath)],
      (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve(stdout.trim());
      }
    );
  });
};

// Upload video, extract audio, transcribe
const extractAudioAndTranscribe = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No video uploaded" });

    // 1️⃣ Upload video to Cloudinary
    const uploadedVideo = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
    });

    // 2️⃣ Extract audio
    const audioPath = path.join(__dirname, "../uploads", Date.now() + "-audio.mp3");
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .output(audioPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // 3️⃣ Upload audio to Cloudinary
    const uploadedAudio = await cloudinary.uploader.upload(audioPath, {
      resource_type: "auto",
    });

    // 4️⃣ Transcribe audio using Ollama CLI
    const transcript = await transcribeWithOllama(audioPath);

    // 5️⃣ Save to MongoDB
    const newVideo = await Video.create({
      title: req.file.originalname,
      videoUrl: uploadedVideo.secure_url,
      audioUrl: uploadedAudio.secure_url,
      transcript,
    });

    // 6️⃣ Cleanup local files
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(audioPath);

    res.json({
      message: "Video uploaded, audio extracted, and transcription done!",
      video: newVideo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Processing failed", error: err.message });
  }
};

module.exports = { extractAudioAndTranscribe };
