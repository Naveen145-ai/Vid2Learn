const ffmpeg = require("fluent-ffmpeg");
const cloudinary = require("../config/cloudinary");
const Video = require("../models/videoModel");
const streamifier = require("streamifier");
const { spawn } = require("child_process");

// Helper: extract audio directly from buffer
const extractAudioBuffer = (videoBuffer) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const command = ffmpeg()
      .input(streamifier.createReadStream(videoBuffer))
      .format("mp3")
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe();

    command.on("data", (chunk) => chunks.push(chunk));
  });
};

// Upload video, extract audio, generate transcript/summary/quiz
const extractAudioAndGenerateNotes = async (req, res) => {
  console.log('Upload request received');
  try {
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ success: false, message: "No video file provided" });
    }
    
    console.log(`Received file: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // 1️⃣ Upload video to Cloudinary
    console.log('Starting Cloudinary upload...');
    cloudinary.uploader.upload_stream(
      { 
        resource_type: "video",
        folder: 'videos',
        chunk_size: 6000000 // 6MB chunks for better reliability
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to upload video to Cloudinary',
            error: error.message 
          });
        }
        if (error) return res.status(500).json({ message: error.message });

        const videoUrl = result.secure_url;

        // 2️⃣ Extract audio from uploaded video buffer
        const audioBuffer = await extractAudioBuffer(req.file.buffer);

        // 3️⃣ Upload audio to Cloudinary
        const uploadedAudio = await cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          async (err, audioResult) => {
            if (err) return res.status(500).json({ message: err.message });

            const audioUrl = audioResult.secure_url;

            // 4️⃣ Generate transcript, summary, key concepts, quiz using Ollama
            const prompt = `
              Transcribe the audio at URL: ${audioUrl}
              Then provide:
              1. transcript
              2. summary
              3. key concepts (array)
              4. 5 multiple-choice questions with 4 options each and correct answer
              Format output as JSON with keys: transcript, summary, keyConcepts, quiz
            `;

            const child = spawn("ollama", ["run", "deepseek-r1:8b", "--prompt", prompt]);
            let output = "";

            child.stdout.on("data", (data) => (output += data.toString()));
            child.stderr.on("data", (errData) => console.error("Ollama error:", errData.toString()));

            child.on("close", async () => {
              let notes;
              try {
                notes = JSON.parse(output);
              } catch (err) {
                console.error("Failed to parse Ollama output:", err);
                return res.status(500).json({ message: "Failed to process audio notes" });
              }

              // 5️⃣ Save to MongoDB
              const video = await Video.create({
                title: req.file.originalname,
                videoUrl,
                audioUrl,
                transcript: notes.transcript,
                summary: notes.summary,
                keyConcepts: notes.keyConcepts,
                quiz: notes.quiz,
              });

              res.json({ message: "Video processed successfully!", video });
            });
          }
        );

        streamifier.createReadStream(audioBuffer).pipe(uploadedAudio);
      }
    );

    // Pipe video buffer to Cloudinary upload
    streamifier.createReadStream(req.file.buffer).pipe(uploadedVideo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Processing failed", error: err.message });
  }
};

module.exports = { extractAudioAndGenerateNotes };
