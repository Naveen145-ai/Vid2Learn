const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { extractAudioAndGenerateNotes } = require("../controllers/videoController");

router.post("/upload", upload.single("video"), extractAudioAndGenerateNotes);

module.exports = router;
