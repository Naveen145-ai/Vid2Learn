const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer"); // your multer setup
const { extractAudioAndTranscribe } = require("../controllers/videoController");

// Upload video & process audio
router.post("/upload-and-transcribe", upload.single("video"), extractAudioAndTranscribe);

module.exports = router;
