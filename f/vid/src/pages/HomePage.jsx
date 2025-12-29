import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SparklesIcon, PlayCircleIcon, BookOpenIcon, AcademicCapIcon, CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Navbar from "../components/Navbar";
import "../styles/home-premium.css";

export default function HomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const features = [
  
     {
      icon: "✨",
      title: "AI-Powered Summaries",
      description: "Get intelligent summaries that capture the essence of your videos",
    },
    {
      icon: "▶️",
      title: "Auto Transcription",
      description: "Perfect transcripts generated automatically from your video audio",
    },
    {
      icon: "📖",
      title: "Key Concepts",
      description: "Extract and organize important concepts from your learning materials",
    },
     
  ];

  const workflowSteps = [
    { step: 1, title: "Upload", description: "Share your educational video" },
    { step: 2, title: "Process", description: "AI analyzes and extracts content" },
    { step: 3, title: "Learn", description: "Access transcripts and summaries" },
    { step: 4, title: "Master", description: "Test yourself with smart quizzes" },
  ];

  return (
    <>
      <div className="home-navbar">
        <div className="home-navbar-container">
          <div className="home-navbar-brand">
            <h2 className="home-brand-title">Vid2Learn</h2>
          </div>
          <div className="home-navbar-links">
            {user && (
              <button onClick={() => navigate("/upload")} className="home-nav-btn home-nav-upload">
                📤 Upload Video
              </button>
            )}
            {!user && (
              <>
                <button onClick={() => navigate("/login")} className="home-nav-btn home-nav-login">
                  Sign In
                </button>
                <button onClick={() => navigate("/signup")} className="home-nav-btn home-nav-signup">
                  Register
                </button>
              </>
            )}
            {user && (
              <div className="home-user-info">
                <div className="home-profile-dropdown">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="home-profile-btn"
                  >
                    <div className="home-profile-icon">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {showProfileDropdown && (
                    <div className="home-profile-menu">
                      <div className="home-profile-header">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                      </div>
                      <div className="home-profile-divider"></div>
                      <button 
                        onClick={() => {
                          navigate("/profile-history");
                          setShowProfileDropdown(false);
                        }}
                        className="home-profile-item"
                      >
                        📚 Upload History
                      </button>
                      <div className="home-profile-divider"></div>
                      <button 
                        onClick={() => {
                          localStorage.removeItem("user");
                          navigate("/");
                          setShowProfileDropdown(false);
                        }} 
                        className="home-profile-item home-profile-logout"
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
      
      <div className="home-page">
        <div className="home-container">
          <div className="home-header">
            <h1>Welcome back, {user?.name || "Learner"}</h1>
            <p>Start uploading videos and transform them into powerful study materials with AI</p>
          </div>

          <div className="home-content">
            {/* Features Grid - Only show when NOT logged in */}
            {!user && (
              <div className="home-grid">
                {features.map((feature, index) => (
                  <div key={index} className="home-card">
                    <div className="home-card-icon">
                      {feature.icon}
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Workflow Section */}
            <div className="home-workflow">
              <h2>How It Works</h2>
              <div className="home-workflow-steps">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="home-workflow-step">
                    <div className="home-workflow-number">{step.step}</div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            {!user && (
              <div className="home-cta">
                <h2>Ready to Transform Your Learning?</h2>
                <p>Join thousands of students and educators using Vid2Learn</p>
                <button onClick={() => navigate("/signup")} className="home-cta-btn">
                  Get Started Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
