const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { uploadVideo, extractAudio } = require("../controllers/videoController");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Cloudinary setup for Multer
const videoStorage = new CloudinaryStorage({
  cloudinary: require("cloudinary").v2,
  params: {
    folder: "vid2learn/videos",
    resource_type: "video",
  },
});

const upload = multer({ storage: videoStorage });

router.post("/upload", upload.single("video"), uploadVideo);
router.post("/extract-audio", extractAudio);

module.exports = router;
