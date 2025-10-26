// src/components/UploadVideo.jsx
import { useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL, API_ENDPOINTS } from "../config";

const UploadVideo = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", file.name);

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_VIDEO}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      onUpload(data.video);
      alert("✅ Video processed successfully!");
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert(`❌ Upload failed: ${err.message || 'Please check console for details'}`);
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
        <p className="text-gray-500 mb-3">Drag & drop video here or click to select</p>
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
    </div>
  );
};

export default UploadVideo;
