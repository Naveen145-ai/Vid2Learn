import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/profile-history.css";

export default function ProfileHistory() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [uploadHistory, setUploadHistory] = useState(
    JSON.parse(localStorage.getItem("uploadHistory")) || []
  );

  if (!user) {
    navigate("/login");
    return null;
  }

  const deleteFromHistory = (id) => {
    const updatedHistory = uploadHistory.filter((item) => item.id !== id);
    setUploadHistory(updatedHistory);
    localStorage.setItem("uploadHistory", JSON.stringify(updatedHistory));
  };

  return (
    <>
      <div className="profile-navbar">
        <div className="profile-navbar-container">
          <div className="profile-navbar-brand">
            <h2 className="profile-brand-title">Vid2Learn</h2>
          </div>
          <div className="profile-navbar-links">
            <button onClick={() => navigate("/")} className="profile-nav-btn profile-nav-home">
              🏠 Home
            </button>
            <div className="profile-user-info">
              <div className="profile-profile-dropdown">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="profile-profile-btn"
                >
                  <div className="profile-profile-icon">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                {showProfileDropdown && (
                  <div className="profile-profile-menu">
                    <div className="profile-profile-header">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                    <div className="profile-profile-divider"></div>
                    <button 
                      onClick={() => {
                        localStorage.removeItem("user");
                        navigate("/");
                        setShowProfileDropdown(false);
                      }} 
                      className="profile-profile-item profile-profile-logout"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>📚 Your Upload History</h1>
            <p>View and manage all your uploaded videos and study materials</p>
          </div>

          <div className="profile-content">
            {uploadHistory.length > 0 ? (
              <div className="history-grid">
                {uploadHistory.map((item) => (
                  <div key={item.id} className="history-card">
                    <div className="history-card-header">
                      <h3>{item.title}</h3>
                      <button
                        onClick={() => deleteFromHistory(item.id)}
                        className="history-delete-btn"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="history-content">
                      <div className="history-section">
                        <h4>📝 Summary</h4>
                        <p className="history-text">
                          {item.summary?.substring(0, 150)}...
                        </p>
                      </div>

                      <div className="history-section">
                        <h4>📄 Transcript</h4>
                        <p className="history-text">
                          {item.transcript?.substring(0, 150)}...
                        </p>
                      </div>

                      <div className="history-section">
                        <h4>🎯 Concepts</h4>
                        <div className="history-concepts">
                          {item.keyConcepts?.slice(0, 3).map((concept, idx) => (
                            <span key={idx} className="history-concept-tag">
                              {concept}
                            </span>
                          ))}
                          {item.keyConcepts?.length > 3 && (
                            <span className="history-concept-tag">
                              +{item.keyConcepts.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="history-section">
                        <h4>❓ Quiz Questions</h4>
                        <p className="history-count">
                          {item.quiz?.length || 0} questions
                        </p>
                      </div>
                    </div>

                    <div className="history-card-footer">
                      <span className="history-date">
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => navigate("/upload")}
                        className="history-view-btn"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-empty">
                <div className="empty-icon">📚</div>
                <h2>No uploads yet</h2>
                <p>Start by uploading a video to see your history here</p>
                <button
                  onClick={() => navigate("/upload")}
                  className="profile-empty-btn"
                >
                  Upload Your First Video
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
