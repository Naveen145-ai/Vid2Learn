const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { extractAudioAndGenerateNotes } = require("../controllers/videoController");

// Upload & process video
router.post("/upload-and-process", upload.single("video"), extractAudioAndGenerateNotes);

module.exports = router;
