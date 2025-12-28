const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { extractAudioAndGenerateNotes, testGoogleAPI } = require("../controllers/videoController");

router.post("/upload", upload.single("video"), extractAudioAndGenerateNotes);
router.get("/test-google-api", testGoogleAPI);

module.exports = router;
