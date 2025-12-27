import { useState } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL, API_ENDPOINTS } from "../config";

const UploadVideo = ({ onUpload = () => {} }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("video", file); // MUST be "video"
      formData.append("title", file.name);

      const res = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_VIDEO}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // Send processed video data to parent
      onUpload(data.video);

      alert("✅ Video processed successfully!");
      setFile(null);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white shadow-lg rounded-2xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Upload Educational Video
      </h2>

      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl">
        <CloudArrowUpIcon className="h-12 w-12 text-indigo-500 mb-3" />

        <p className="text-gray-500 mb-3">
          Select an educational video to process
        </p>

        <input
          type="file"
          accept="video/*"
          id="videoUpload"
          className="hidden"
          onChange={handleFileChange}
        />

        <label
          htmlFor="videoUpload"
          className="px-4 py-2 bg-indigo-500 text-white rounded-md cursor-pointer hover:bg-indigo-600"
        >
          Choose Video
        </label>

        {file && (
          <p className="mt-3 text-sm text-gray-700">
            Selected: <strong>{file.name}</strong>
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-4 w-full bg-indigo-500 text-white font-semibold py-2 rounded-xl hover:bg-indigo-600 disabled:bg-gray-300"
      >
        {loading ? "Processing..." : "Upload & Process"}
      </button>
    </div>
  );
};

export default UploadVideo;
