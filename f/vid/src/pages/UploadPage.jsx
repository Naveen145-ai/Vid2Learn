import { useState } from "react";
import { CloudArrowUpIcon, CheckCircleIcon, DocumentTextIcon, StarIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL, API_ENDPOINTS } from "../config";
import { useNavigate } from "react-router-dom";
import "../styles/upload-premium.css";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || null;

  if (!user) {
    navigate("/login");
    return null;
  }

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

      setVideo(data.video);
      setFile(null);
      setActiveTab("summary");
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!video) return;

    const uploadHistory = JSON.parse(localStorage.getItem("uploadHistory")) || [];
    const newEntry = {
      id: Date.now(),
      title: video.title,
      summary: video.summary,
      transcript: video.transcript,
      keyConcepts: video.keyConcepts,
      quiz: video.quiz,
      uploadedAt: new Date().toISOString(),
    };

    uploadHistory.push(newEntry);
    localStorage.setItem("uploadHistory", JSON.stringify(uploadHistory));
    
    alert("✅ Saved to your library!");
    navigate("/profile-history");
  };

  return (
    <>
      <div className="upload-navbar">
        <div className="upload-navbar-container">
          <div className="upload-navbar-brand">
            <h2 className="upload-brand-title">Vid2Learn</h2>
          </div>
          <div className="upload-navbar-links">
            {user && (
              <button disabled className="upload-nav-btn upload-nav-upload">
                📤 Upload Video
              </button>
            )}
            {user && (
              <div className="upload-user-info">
                <div className="upload-profile-dropdown">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="upload-profile-btn"
                  >
                    <div className="upload-profile-icon">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {showProfileDropdown && (
                    <div className="upload-profile-menu">
                      <div className="upload-profile-header">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                      </div>
                      <div className="upload-profile-divider"></div>
                      <button 
                        onClick={() => {
                          navigate("/profile-history");
                          setShowProfileDropdown(false);
                        }}
                        className="upload-profile-item"
                      >
                        📚 Upload History
                      </button>
                      <div className="upload-profile-divider"></div>
                      <button 
                        onClick={() => {
                          localStorage.removeItem("user");
                          navigate("/");
                          setShowProfileDropdown(false);
                        }} 
                        className="upload-profile-item upload-profile-logout"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="upload-page">
        <div className="upload-header">
          <h1>Upload & Transform</h1>
          <p>Convert your educational videos into powerful study materials instantly</p>
        </div>

        <div className="upload-container">
          {/* Left Column - Upload */}
          <div className="upload-section">
            <div className="upload-card">
              <h2>Select Your Video</h2>

              <label htmlFor="video-input" className={`upload-area ${file ? "has-file" : ""}`}>
                <div className="upload-icon">📹</div>
                <p>{file ? `✓ ${file.name}` : "Click to select or drag & drop"}</p>
                <p className="file-info">MP4, WebM, or Mov (Max 500MB)</p>
                <input
                  id="video-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`upload-btn ${loading ? "loading" : ""}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Upload & Process"
                )}
              </button>
            </div>

            <div className="tips-card">
              <h3>💡 Pro Tips</h3>
              <ul>
                <li>✓ Clear audio quality works best</li>
                <li>✓ Videos up to 30 minutes recommended</li>
                <li>✓ Processing takes 2-5 minutes</li>
                <li>✓ Results are saved automatically</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Results */}
          {video ? (
            <div className="results-section">
              <div className="success-badge">
                <div className="success-icon">✓</div>
                <div className="success-content">
                  <h3>Processing Complete!</h3>
                  <p>Your video has been analyzed. Study materials are ready below.</p>
                </div>
              </div>

              <div className="tabs-container">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
                >
                  📝 Summary
                </button>
                <button
                  onClick={() => setActiveTab("concepts")}
                  className={`tab-btn ${activeTab === "concepts" ? "active" : ""}`}
                >
                  🎯 Concepts
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`tab-btn ${activeTab === "quiz" ? "active" : ""}`}
                >
                  ❓ Quiz
                </button>
                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`tab-btn ${activeTab === "transcript" ? "active" : ""}`}
                >
                  📄 Transcript
                </button>
              </div>

              <div className="results-card">
                <div>
                  <h3>📺 {video.title}</h3>
                </div>

                <div>
                  <h4 style={{ color: "rgba(16, 185, 129, 0.9)", fontSize: "18px", fontWeight: "700", margin: "0 0 12px 0" }}>📝 Summary</h4>
                  <div className="summary-text">
                    {video.summary || "No summary available"}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: "rgba(16, 185, 129, 0.9)", fontSize: "18px", fontWeight: "700", margin: "0 0 12px 0" }}>📄 Transcript</h4>
                  <div className="transcript-text">
                    {video.transcript || "No transcript available"}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: "rgba(16, 185, 129, 0.9)", fontSize: "18px", fontWeight: "700", margin: "0 0 12px 0" }}>🎯 Key Concepts</h4>
                  {video.keyConcepts && video.keyConcepts.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {video.keyConcepts.map((concept, i) => (
                        <div key={i} className="concept-item">
                          <div className="concept-number">{i + 1}</div>
                          <p className="concept-text">{concept}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "rgba(255, 255, 255, 0.6)" }}>No concepts found</p>
                  )}
                </div>

                <div>
                  <h4 style={{ color: "rgba(16, 185, 129, 0.9)", fontSize: "18px", fontWeight: "700", margin: "0 0 12px 0" }}>❓ Quiz Questions</h4>
                  {video.quiz && video.quiz.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {video.quiz.map((q, i) => (
                        <div key={i} className="quiz-question">
                          <div className="quiz-number">Question {i + 1}</div>
                          <div className="question-text">{q.question}</div>
                          <div className="quiz-options">
                            {q.options && q.options.map((option, j) => (
                              <label key={j} className="quiz-option">
                                <input type="radio" name={`question-${i}`} />
                                <span>{option}</span>
                                {option === q.answer && (
                                  <span className="correct-badge">✓ Correct</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "rgba(255, 255, 255, 0.6)" }}>No quiz questions found</p>
                  )}
                </div>
              </div>

              <button onClick={handleSaveToLibrary} className="save-btn">Save to My Library ✨</button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <p>Upload a video to see results</p>
              <p style={{ fontSize: "14px", opacity: 0.7 }}>Your transcript, summary, and quiz will appear here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
