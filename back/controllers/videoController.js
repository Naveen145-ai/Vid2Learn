const ffmpeg = require("fluent-ffmpeg");
const cloudinary = require("cloudinary").v2;
const Video = require("../models/videoModel");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Extract audio to temp file
const extractAudio = (inputPath) =>
  new Promise((resolve, reject) => {
    const output = path.join(__dirname, "../uploads", `${Date.now()}_audio.mp3`);
    ffmpeg(inputPath)
      .output(output)
      .audioCodec("libmp3lame")
      .on("end", () => resolve(output))
      .on("error", reject)
      .run();
  });

// Helper to extract JSON from messy text
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

exports.extractAudioAndGenerateNotes = async (req, res) => {
  console.log("📩 Received video upload request...");

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No video file uploaded"
    });
  }

  const localVideo = req.file.path;

  try {
    // Upload video to Cloudinary
    const videoResult = await cloudinary.uploader.upload(localVideo, {
      resource_type: "video",
      folder: "videos"
    });

    console.log("☁️ Video uploaded:", videoResult.secure_url);

    // Extract audio
    const audioPath = await extractAudio(localVideo);

    const audioResult = await cloudinary.uploader.upload(audioPath, {
      resource_type: "auto",
      folder: "audios"
    });

    console.log("🎧 Audio uploaded:", audioResult.secure_url);

    // AI prompt
    const prompt = `
You are a learning assistant. 
Transcribe and summarize the audio from this link: ${audioResult.secure_url}

Return ONLY clean JSON:
{
  "transcript": "",
  "summary": "",
  "keyConcepts": [],
  "quiz": []
}
`;

    // --- OLLAMA CALL (stdin method) ---
    const model = "deepseek-r1:1.5b";
    console.log(`🚀 Starting Ollama with model: ${model}`);
    
    try {
      const ollama = spawn("ollama", ["run", model]);

      let output = "";
      let errorOutput = "";
      let hasTimedOut = false;

      // Set a timeout (e.g., 5 minutes)
      const timeout = setTimeout(() => {
        hasTimedOut = true;
        ollama.kill('SIGTERM');
        console.error("❌ Ollama process timed out after 5 minutes");
      }, 5 * 60 * 1000);

      ollama.stdout.on("data", (data) => {
        const dataStr = data.toString();
        console.log("Ollama output:", dataStr);
        output += dataStr;
      });

      ollama.stderr.on("data", (err) => {
        const errStr = err.toString();
        console.error("❌ Ollama stderr:", errStr);
        errorOutput += errStr;
      });

      // Handle process errors
      ollama.on("error", (err) => {
        console.error("❌ Failed to start Ollama process:", err);
        if (!hasTimedOut) clearTimeout(timeout);
        throw new Error(`Failed to start Ollama: ${err.message}`);
      });

      // Send the prompt into ollama
      console.log("📤 Sending prompt to Ollama...");
      ollama.stdin.write(prompt);
      ollama.stdin.end();

      // When ollama completes
      return new Promise((resolve, reject) => {
        ollama.on("close", async (code) => {
          clearTimeout(timeout);
          
          if (hasTimedOut) {
            return reject(new Error("Ollama process timed out"));
          }
          
          console.log(`🔵 Ollama process exited with code ${code}`);
          
          if (code !== 0) {
            console.error("❌ Ollama process failed with code:", code);
            console.error("Error output:", errorOutput);
            return reject(new Error(`Ollama process failed with code ${code}: ${errorOutput}`));
          }
          
          try {
            const cleaned = output.replace(/[\x00-\x1F]/g, "");
            const jsonString = extractJson(cleaned);

            if (!jsonString) {
              throw new Error("AI did not return valid JSON");
            }

            const parsed = JSON.parse(jsonString);

            // SAVE to MongoDB
            const saved = await Video.create({
              title: req.file.originalname,
              videoUrl: videoResult.secure_url,
              audioUrl: audioResult.secure_url,
              transcript: parsed.transcript || "",
              summary: parsed.summary || "",
              keyConcepts: parsed.keyConcepts || [],
              quiz: parsed.quiz || []
            });

            // Clean temp files
            fs.unlinkSync(localVideo);
            fs.unlinkSync(audioPath);

            console.log("✅ Saved video data!");
            resolve({ success: true, video: saved });
          } catch (e) {
            console.error("❌ Parse error:", e);
            console.error("Raw output that failed to parse:", output);
            reject(new Error(`Failed to parse Ollama output: ${e.message}`));
          }
        });
      }).then((result) => {
        res.json(result);
      }).catch((err) => {
        console.error("🔥 Upload or extraction failed:", err);
        res.status(500).json({
          message: "Upload failed",
          error: err.message
        });
      });
    } catch (err) {
      console.error("❌ Error in Ollama process:", err);
      res.status(500).json({
        message: "Upload failed",
        error: err.message
      });
    }
  } catch (err) {
    console.error("🔥 Error in video processing:", err);
    res.status(500).json({
      message: "Video processing failed",
      error: err.message
    });
  }
};
