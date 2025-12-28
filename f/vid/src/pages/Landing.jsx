import { useNavigate } from "react-router-dom";
import "../styles/landing-premium.css";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "✨",
      title: "AI-Powered Summaries",
      description: "Get intelligent summaries from video content automatically",
    },
    {
      icon: "📝",
      title: "Auto Transcription",
      description: "Perfect transcripts generated from your video audio",
    },
    {
      icon: "🎯",
      title: "Smart Quiz Generation",
      description: "Test your knowledge with AI-generated quiz questions",
    },
  ];

  const workflowSteps = [
    { num: 1, title: "Upload Video", desc: "Share your educational video" },
    { num: 2, title: "AI Processing", desc: "Our AI analyzes the content" },
    { num: 3, title: "Get Materials", desc: "Access summaries & transcripts" },
    { num: 4, title: "Study & Test", desc: "Practice with smart quizzes" },
  ];

  const testimonials = [
    {
      author: "Sarah M.",
      role: "Student",
      text: "Vid2Learn saved me hours of note-taking. The AI summaries are incredibly helpful!",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      author: "John D.",
      role: "Educator",
      text: "My students love the automated quizzes. It's a game-changer for my class!",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      author: "Emma K.",
      role: "Online Learner",
      text: "The transcripts are perfect! I can easily search for specific concepts now.",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      author: "Mike L.",
      role: "Researcher",
      text: "Incredibly useful for organizing lecture materials. Highly recommend!",
      rating: "⭐⭐⭐⭐⭐"
    },
    {
      author: "Lisa R.",
      role: "Student",
      text: "This tool helped me improve my grades significantly. Worth every penny!",
      rating: "⭐⭐⭐⭐⭐"
    },
  ];

  return (
    <div className="landing-page">
      <div className="landing-content">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-badge">✨ Transform Your Learning</div>

          <h1>Learn Smarter with AI-Powered Video Analysis</h1>
          <p>Transform educational videos into powerful study materials instantly. Get summaries, transcripts, key concepts, and quizzes all automatically generated.</p>

          <div className="landing-cta-buttons">
            <button onClick={() => navigate("/home")} className="landing-btn-primary">
              Get Started Free
            </button>
            <button onClick={() => navigate("/login")} className="landing-btn-secondary">
              Sign In
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="landing-features">
          <h2>Powerful Features</h2>
          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="landing-feature-card">
                <div className="icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="landing-cta-section">
          <h2 className="landing-cta-title">Ready to Transform Your Learning?</h2>
          <p className="landing-cta-subtitle">Join thousands of students and educators using Vid2Learn today</p>
        </section>
      </div>
    </div>
  );
}
