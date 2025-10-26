import { useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

const UploadVideo = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // 1️⃣ Upload video to backend
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch("http://localhost:4000/api/video/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setVideoUrl(data.videoUrl);
      console.log("Video uploaded:", data.videoUrl);

      // 2️⃣ Extract audio from video
      const audioRes = await fetch(
        "http://localhost:4000/api/video/extract-audio",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: data.videoUrl }),
        }
      );

      const audioData = await audioRes.json();
      setAudioUrl(audioData.audioUrl);
      console.log("Audio extracted:", audioData.audioUrl);

      alert("✅ Video uploaded and audio extracted successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Something went wrong during upload.");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white shadow-lg rounded-2xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Upload Educational Video
      </h2>

      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500">
        <CloudArrowUpIcon className="h-12 w-12 text-indigo-500 mb-3" />
        <p className="text-gray-500 mb-3">
          Drag & drop video here or click to select
        </p>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          id="videoUpload"
          onChange={handleFileChange}
        />
        <label
          htmlFor="videoUpload"
          className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
        >
          Choose File
        </label>
        {file && <p className="mt-2 text-gray-700">{file.name}</p>}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-4 w-full bg-indigo-500 text-white font-semibold py-2 rounded-xl hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Uploading..." : "Upload & Process"}
      </button>

      {videoUrl && (
        <div className="mt-4">
          <h3 className="font-semibold">Uploaded Video URL:</h3>
          <a href={videoUrl} target="_blank" rel="noreferrer" className="text-indigo-500 underline">
            {videoUrl}
          </a>
        </div>
      )}

      {audioUrl && (
        <div className="mt-2">
          <h3 className="font-semibold">Extracted Audio URL:</h3>
          <a href={audioUrl} target="_blank" rel="noreferrer" className="text-indigo-500 underline">
            {audioUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
