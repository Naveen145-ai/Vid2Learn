const mongoose = require("mongoose");
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  audioUrl: {
    type: String,
  },
  transcript: {
    type: String,
  },
  summary: {
    type: String,
  },
  keyConcepts: [
    {
      topic: String,
      definition: String,
    },
  ],
  quiz: [
    {
      question: String,
      options: [String],
      answer: String,
    },
  ],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports=  mongoose.model("Video", videoSchema);

console.log("Video model loaded");
