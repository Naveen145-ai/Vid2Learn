import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserIcon, EnvelopeIcon, LockClosedIcon, CheckIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL, API_ENDPOINTS } from "../config";
import "../styles/signup.css";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (!email.includes("@")) {
        setError("Invalid email address");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SIGNUP}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <div className="signup-logo">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h1>Vid2Learn</h1>
          <p>Join thousands of smarter learners</p>
        </div>

        <div className="signup-card">
          <h2>Get Started</h2>
          <p>Create your account in seconds</p>

          {error && (
            <div className="signup-error">
              <XCircleIcon width="20" height="20" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="signup-form">
            <div className="signup-input-group">
              <label htmlFor="name">Full Name</label>
              <div className="signup-input-wrapper">
                <UserIcon />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="signup-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="signup-input-wrapper">
                <EnvelopeIcon />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="signup-input-group">
              <label htmlFor="password">Password</label>
              <div className="signup-input-wrapper">
                <LockClosedIcon />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className="signup-input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="signup-input-wrapper">
                <CheckIcon />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="signup-btn">
              {loading ? (
                <>
                  <div className="signup-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <CheckIcon width="20" height="20" />
                </>
              )}
            </button>
          </form>

          <div className="signup-divider">
            <div className="signup-divider-line"></div>
            <span className="signup-divider-text">Already registered?</span>
            <div className="signup-divider-line"></div>
          </div>

          <Link to="/login" className="signup-login-link">
            Sign In Instead
          </Link>
        </div>

        <p className="signup-footer">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
