// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadVideo from "./components/UploadVideo";


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Main dashboard with upload and video list */}
           <Route path="/" element={<UploadVideo />} />
         

         
        </Routes>
      </div>
    </Router>
  );
}

export default App;
