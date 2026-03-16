import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TypewriterText, FadeInOnScroll, StaggeredList } from "../components/AnimatedElements";
import WelcomeStats from "../components/WelcomeStats";
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./Welcome.css";

const Welcome = () => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    "Knowledge is power, especially when it comes to your rights.",
    "Empower yourself with legal knowledge in your language.",
    "Your rights matter. Learn them, understand them, exercise them.",
    "Justice begins with awareness and education."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="wlc-page">
      {/* Animated Background */}
      <div className="wlc-bg">
        <div className="wlc-orb wlc-orb-1"></div>
        <div className="wlc-orb wlc-orb-2"></div>
        <div className="wlc-orb wlc-orb-3"></div>
        <div className="wlc-bg-pattern"></div>
      </div>

      <div className="wlc-content">
        {/* Header */}
        <FadeInOnScroll direction="scale" delay={0}>
          <div className="wlc-header">
            <div className="wlc-logo-wrap">
              <div className="wlc-logo">
                <i className="bi bi-shield-check"></i>
              </div>
            </div>
            <h1 className="wlc-brand">
              <TypewriterText text="LR - Learn Rights" speed={80} delay={300} />
            </h1>
            <p className="wlc-tagline">Know your legal rights in your own language</p>
          </div>
        </FadeInOnScroll>

        {/* Main Card */}
        <FadeInOnScroll direction="up" delay={200}>
          <div className="wlc-card">
            <div className="wlc-card-inner">
              <div className="wlc-hero-icon">
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <h2 className="wlc-hero-title">Welcome to Legal Education</h2>
              <p className="wlc-hero-desc">
                Empower yourself with comprehensive legal knowledge. Learn about your rights, understand legal procedures, and navigate the justice system with confidence.
              </p>

              {/* Rotating Quotes */}
              <div className="wlc-quote-box">
                <i className="bi bi-lightbulb-fill wlc-quote-icon"></i>
                <p className="wlc-quote-text">{quotes[currentQuote]}</p>
                <div className="wlc-quote-dots">
                  {quotes.map((_, index) => (
                    <span key={index} className={`wlc-dot ${index === currentQuote ? 'active' : ''}`}></span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="wlc-features">
                <StaggeredList staggerDelay={120}>
                  <div className="wlc-feat">
                    <div className="wlc-feat-icon"><i className="bi bi-translate"></i></div>
                    <span className="wlc-feat-text">Multi-language</span>
                  </div>
                  <div className="wlc-feat">
                    <div className="wlc-feat-icon wlc-feat-blue"><i className="bi bi-book-half"></i></div>
                    <span className="wlc-feat-text">Interactive</span>
                  </div>
                  <div className="wlc-feat">
                    <div className="wlc-feat-icon wlc-feat-green"><i className="bi bi-graph-up-arrow"></i></div>
                    <span className="wlc-feat-text">Track Progress</span>
                  </div>
                  <div className="wlc-feat">
                    <div className="wlc-feat-icon wlc-feat-pink"><i className="bi bi-robot"></i></div>
                    <span className="wlc-feat-text">AI Assistant</span>
                  </div>
                </StaggeredList>
              </div>

              {/* Stats Counter Row */}
              <div className="wlc-stats-row">
                {/* Dynamic stats from API */}
                <WelcomeStats />
              </div>

              {/* CTA Buttons */}
              <div className="wlc-buttons">
                <button className="wlc-btn wlc-btn-primary" onClick={() => navigate("/signup")}>
                  <i className="bi bi-person-plus-fill"></i>
                  Sign Up
                </button>
                <button className="wlc-btn wlc-btn-outline" onClick={() => navigate("/login")}>
                  <i className="bi bi-box-arrow-in-right"></i>
                  Login
                </button>
              </div>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Footer */}
        <FadeInOnScroll direction="up" delay={600}>
          <p className="wlc-footer">Join thousands of users learning their legal rights</p>
        </FadeInOnScroll>
      </div>
    </div>
  );
};

export default Welcome;