const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/videoModel");

ffmpeg.setFfmpegPath(ffmpegStatic);

exports.uploadVideo = async (req, res) => {
  try {
    const videoUrl = req.file.path;
    const title = req.file.originalname;

    const newVideo = new Video({ title, videoUrl });
    await newVideo.save();

    res.status(200).json({
      message: "Video uploaded successfully to Cloudinary",
      videoUrl,
      videoId: newVideo._id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

exports.extractAudio = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const outputPath = path.join("temp", `${Date.now()}.mp3`);

    if (!fs.existsSync("temp")) fs.mkdirSync("temp");

    ffmpeg(videoUrl)
      .noVideo()
      .audioCodec("libmp3lame")
      .save(outputPath)
      .on("end", async () => {
        try {
          const audioUpload = await cloudinary.uploader.upload(outputPath, {
            folder: "vid2learn/audio",
            resource_type: "video",
          });

          fs.unlinkSync(outputPath);

          res.status(200).json({
            message: "Audio extracted and uploaded to Cloudinary",
            audioUrl: audioUpload.secure_url,
          });
        } catch (uploadErr) {
          console.error(uploadErr);
          res.status(500).json({ error: "Audio upload failed" });
        }
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).json({ error: "Error extracting audio" });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
