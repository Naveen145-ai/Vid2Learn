// src/pages/Dashboard.jsx
import UploadVideo from "../components/UploadVideo";
import VideoCard from "../components/VideoCard";

const Dashboard = () => {
  const handleUpload = (file) => {
    console.log("Uploading video:", file);
    // Later connect API to backend
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Vid2Learn Dashboard</h1>

      {/* Upload Section */}
      <UploadVideo onUpload={handleUpload} />

      {/* Videos List */}
      <h2 className="mt-10 text-2xl font-semibold text-gray-700">Uploaded Videos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {/* Example cards, later map API response */}
        <VideoCard title="React Basics" duration="10 min" />
        <VideoCard title="Node.js API" duration="15 min" />
      </div>
    </div>
  );
};

export default Dashboard;
