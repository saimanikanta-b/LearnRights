import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { t } from '../utils/translation';
import { signupUser } from "../services/authService";
import { useUser } from "../contexts/UserContext";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredLanguage: "en"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (form.password !== form.confirmPassword) {
      setError(t('auth.passwordMismatch', { defaultValue: 'Passwords do not match' }));
      return false;
    }
    if (form.password.length < 6) {
      setError(t('auth.passwordTooShort', { defaultValue: 'Password must be at least 6 characters' }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const signupData = {
        name: form.name,
        email: form.email,
        password: form.password,
        preferredLanguage: form.preferredLanguage
      };

      const res = await signupUser(signupData);
      if (res.token) {
        login(res.token);
        navigate("/home");
      } else {
        alert(t('auth.signupSuccess', { defaultValue: 'Account created successfully!' }));
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || t('auth.signupFailed', { defaultValue: 'Failed to create account' }));
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'ur', name: 'اردو (Urdu)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'as', name: 'অসমীয়া (Assamese)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' }
  ];

  return (
    <div className="sg-page">
      {/* Animated Background */}
      <div className="sg-bg">
        <div className="sg-orb sg-orb-1"></div>
        <div className="sg-orb sg-orb-2"></div>
        <div className="sg-orb sg-orb-3"></div>
        <div className="sg-bg-dots"></div>
      </div>

      <div className="sg-wrapper">
        <div className="sg-card">
          <div className="sg-card-accent"></div>

          {/* Header */}
          <div className="sg-header">
            <div className="sg-logo">
              <i className="bi bi-person-plus-fill"></i>
            </div>
            <h1 className="sg-brand">Learn Rights</h1>
            <h2 className="sg-title">
              {t('auth.createAccount', { defaultValue: 'Create Your Account' })}
            </h2>
            <p className="sg-subtitle">
              {t('auth.startJourney', { defaultValue: 'Start your legal education journey today' })}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="sg-error">
              <i className="bi bi-exclamation-triangle-fill"></i>
              {error}
            </div>
          )}

          <form className="sg-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="sg-field">
              <label className="sg-label">
                {t('auth.fullName', { defaultValue: 'Full Name' })}
              </label>
              <div className="sg-input-wrap">
                <i className="bi bi-person-fill sg-input-icon"></i>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t('auth.enterFullName', { defaultValue: 'Enter your full name' })}
                  required
                  className="sg-input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="sg-field">
              <label className="sg-label">
                {t('auth.email', { defaultValue: 'Email Address' })}
              </label>
              <div className="sg-input-wrap">
                <i className="bi bi-envelope-fill sg-input-icon"></i>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.enterEmail', { defaultValue: 'Enter your email address' })}
                  required
                  className="sg-input"
                />
              </div>
            </div>

            {/* Language */}
            <div className="sg-field">
              <label className="sg-label">
                {t('auth.preferredLanguage', { defaultValue: 'Preferred Language' })}
              </label>
              <div className="sg-input-wrap">
                <i className="bi bi-translate sg-input-icon"></i>
                <select
                  name="preferredLanguage"
                  value={form.preferredLanguage}
                  onChange={handleChange}
                  className="sg-input sg-select"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <i className="bi bi-chevron-down sg-select-arrow"></i>
              </div>
            </div>

            {/* Password */}
            <div className="sg-field">
              <label className="sg-label">
                {t('auth.password', { defaultValue: 'Password' })}
              </label>
              <div className="sg-input-wrap">
                <i className="bi bi-lock-fill sg-input-icon"></i>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t('auth.createPassword', { defaultValue: 'Create a strong password' })}
                  required
                  className="sg-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="sg-eye-btn"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="sg-field">
              <label className="sg-label">
                {t('auth.confirmPassword', { defaultValue: 'Confirm Password' })}
              </label>
              <div className="sg-input-wrap">
                <i className="bi bi-shield-lock-fill sg-input-icon"></i>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('auth.confirmPassword', { defaultValue: 'Confirm your password' })}
                  required
                  className="sg-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="sg-eye-btn"
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="sg-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="sg-spinner"></span>
                  {t('auth.creatingAccount', { defaultValue: 'Creating Account...' })}
                </>
              ) : (
                <>
                  <i className="bi bi-person-check-fill"></i>
                  {t('auth.createAccount', { defaultValue: 'Create Account' })}
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="sg-login-text">
            {t('auth.alreadyHaveAccount', { defaultValue: 'Already have an account?' })}
            <button type="button" className="sg-login-link" onClick={() => navigate("/login")}>
              {t('auth.signIn', { defaultValue: 'Sign In' })}
            </button>
          </p>

          <div className="sg-footer">
            {t('auth.agreeToTerms', {
              defaultValue: 'By creating an account, you agree to our Terms of Service and Privacy Policy'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;