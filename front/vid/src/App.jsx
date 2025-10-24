// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UploadVideo from "./components/uploadVideo";
import VideoCard from "./components/videoCard";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Main dashboard with upload and video list */}
          <Route path="/" element={<Dashboard />} />

          {/* Video details and components */}
          <Route path="/upload" element={<UploadVideo />} />
          <Route path="/video-card" element={<VideoCard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
