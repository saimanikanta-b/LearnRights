import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { t } from '../utils/translation';
import { loginUser, googleLoginUser } from "../services/authService";
import { useUser } from "../contexts/UserContext";
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginUser(form);
      if (!res.token) {
        throw new Error("No token received. Please try again.");
      }
      login(res.token);
      navigate("/home");
    } catch (err) {
      setError(err.message || t("login.failed", { defaultValue: "Login failed. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth — shows account picker with all logged-in Google accounts
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        // Send the access_token to backend; backend verifies with Google
        const res = await googleLoginUser(tokenResponse.access_token);
        if (!res.token) throw new Error("No token received from Google login.");
        login(res.token);
        navigate("/home");
      } catch (err) {
        setError(err.message || "Google login failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google login error:", err);
      setError("Google login was cancelled or failed.");
    },
    // Force account picker to show all logged-in Google accounts
    prompt: 'select_account',
  });

  return (
    <div className="lg-page">
      <div className="lg-bg">
        <div className="lg-orb lg-orb-1"></div>
        <div className="lg-orb lg-orb-2"></div>
        <div className="lg-orb lg-orb-3"></div>
        <div className="lg-bg-dots"></div>
      </div>

      <div className="lg-wrapper">
        <div className="lg-card">
          <div className="lg-card-accent"></div>

          {/* Header */}
          <div className="lg-header">
            <div className="lg-logo">
              <i className="bi bi-shield-check"></i>
            </div>
            <h1 className="lg-brand">{t("app.name", { defaultValue: "Learn Rights" })}</h1>
            <h2 className="lg-title">{t("login.welcome_back", { defaultValue: "Welcome Back" })}</h2>
            <p className="lg-subtitle">{t("login.sign_in_continue", { defaultValue: "Sign in to continue your learning journey" })}</p>
          </div>

          {/* Form */}
          <form className="lg-form" onSubmit={handleSubmit}>
            {error && (
              <div className="lg-error">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}

            <div className="lg-field">
              <label className="lg-label">{t("login.email", { defaultValue: "Email Address" })}</label>
              <div className="lg-input-wrap">
                <i className="bi bi-envelope-fill lg-input-icon"></i>
                <input type="email" name="email" className="lg-input" placeholder={t("login.email_placeholder", { defaultValue: "Enter your email" })} value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="lg-field">
              <label className="lg-label">{t("login.password", { defaultValue: "Password" })}</label>
              <div className="lg-input-wrap">
                <i className="bi bi-lock-fill lg-input-icon"></i>
                <input type={showPwd ? "text" : "password"} name="password" className="lg-input" placeholder={t("login.password_placeholder", { defaultValue: "Enter your password" })} value={form.password} onChange={handleChange} required />
                <button type="button" className="lg-eye-btn" onClick={() => setShowPwd(!showPwd)}>
                  <i className={`bi ${showPwd ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            <div className="lg-options">
              <label className="lg-check-label">
                <input type="checkbox" className="lg-check" />
                <span className="lg-checkmark"></span>
                {t("login.remember_me", { defaultValue: "Remember me" })}
              </label>
              <button type="button" className="lg-forgot" onClick={() => navigate("/forgot-password")}>
                {t("login.forgot_password", { defaultValue: "Forgot Password?" })}
              </button>
            </div>

            <button type="submit" className={`lg-submit ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? (
                <><div className="lg-spinner"></div> {t("login.signing_in", { defaultValue: "Signing In..." })}</>
              ) : (
                <><i className="bi bi-box-arrow-in-right"></i> {t("login.sign_in", { defaultValue: "Sign In" })}</>
              )}
            </button>
          </form>

          <div className="lg-divider"><span>or</span></div>

          <button className={`lg-social ${googleLoading ? 'loading' : ''}`} onClick={handleGoogleLogin} disabled={googleLoading}>
            {googleLoading ? (
              <><div className="lg-spinner"></div> Signing in with Google...</>
            ) : (
              <><svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg> {t("login.continue_google", { defaultValue: "Continue with Google" })}</>
            )}
          </button>

          <p className="lg-signup-text">
            {t("login.no_account", { defaultValue: "Don't have an account?" })}
            <button type="button" className="lg-signup-link" onClick={() => navigate("/signup")}>
              {t("login.sign_up", { defaultValue: "Sign Up" })}
            </button>
          </p>
        </div>

        <p className="lg-footer">{t("login.footer", { defaultValue: "By signing in, you agree to our Terms of Service and Privacy Policy" })}</p>
      </div>
    </div>
  );
};

export default Login;