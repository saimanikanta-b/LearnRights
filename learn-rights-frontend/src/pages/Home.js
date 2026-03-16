import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { t } from '../utils/translation';
import { TypewriterText, AnimatedCounter, FadeInOnScroll } from "../components/AnimatedElements";
import API from "../api/axios";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: "bi-book-half",
      title: t('home.features.modules.title', { defaultValue: 'Modules' }),
      description: t('home.features.modules.description', { defaultValue: 'Rights explained with real-life examples and interactive content.' }),
      action: () => navigate("/modules"),
      actionText: t('home.features.modules.action', { defaultValue: 'Learn' }),
      color: "#7c3aed"
    },
    {
      icon: "bi-robot",
      title: t('home.features.chatbot.title', { defaultValue: 'AI Bot' }),
      description: t('home.features.chatbot.description', { defaultValue: 'Ask legal questions anytime in your preferred language.' }),
      action: () => navigate("/chatbot"),
      actionText: t('home.features.chatbot.action', { defaultValue: 'Ask' }),
      color: "#ec4899"
    },
    {
      icon: "bi-trophy-fill",
      title: t('home.features.leaderboard.title', { defaultValue: 'Board' }),
      description: t('home.features.leaderboard.description', { defaultValue: 'Earn points, track progress, and compete with others.' }),
      action: () => navigate("/leaderboard"),
      actionText: t('home.features.leaderboard.action', { defaultValue: 'Rank' }),
      color: "#0ea5e9"
    }
  ];

  const [stats, setStats] = useState([
    { icon: "bi-people-fill", number: "-", label: t('home.stats.users', { defaultValue: 'Users' }) },
    { icon: "bi-journal-richtext", number: "-", label: t('home.stats.modules', { defaultValue: 'Modules' }) },
    { icon: "bi-translate", number: "-", label: t('home.stats.languages', { defaultValue: 'Langs' }) },
    { icon: "bi-headset", number: "24/7", label: t('home.stats.support', { defaultValue: 'AI Help' }) }
  ]);

  useEffect(() => {
    API.get("/admin/public-stats")
      .then(res => {
        const data = res.data;
        setStats([
          { icon: "bi-people-fill", number: data.totalUsers || "-", label: t('home.stats.users', { defaultValue: 'Users' }) },
          { icon: "bi-journal-richtext", number: data.totalModules || "-", label: t('home.stats.modules', { defaultValue: 'Modules' }) },
          { icon: "bi-translate", number: data.totalLanguages || "-", label: t('home.stats.languages', { defaultValue: 'Langs' }) },
          { icon: "bi-headset", number: "24/7", label: t('home.stats.support', { defaultValue: 'AI Help' }) }
        ]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="hm-page">
      {/* Hero Section */}
      <section className="hm-hero">
        <div className="hm-hero-bg">
          <div className="hm-orb hm-orb-1"></div>
          <div className="hm-orb hm-orb-2"></div>
          <div className="hm-orb hm-orb-3"></div>
          <div className="hm-hero-dots"></div>
        </div>

        <div className="hm-hero-inner">
          <div className="hm-hero-text">
            <div className="hm-badge">
              <i className="bi bi-shield-check"></i>
              {t('home.hero.badge', { defaultValue: 'Legal Education Platform' })}
            </div>
            <h1 className="hm-hero-title">
              <TypewriterText text={t('home.hero.title', { defaultValue: 'LR - Learn Rights' })} speed={60} delay={400} />
            </h1>
            <p className="hm-hero-subtitle">
              {t('home.hero.subtitle', { defaultValue: 'Empower Yourself' })}
            </p>
            <p className="hm-hero-desc">
              {t('home.hero.description', {
                defaultValue: 'Simple, Multilingual, AI-powered learning platform designed for rural women to understand and exercise their legal rights.'
              })}
            </p>

            <div className="hm-hero-btns">
              <button className="hm-btn hm-btn-primary" onClick={() => navigate("/modules")}>
                <i className="bi bi-rocket-takeoff-fill"></i>
                {t('home.hero.start_learning', { defaultValue: 'Learn' })}
              </button>
              <button className="hm-btn hm-btn-outline" onClick={() => navigate("/dashboard")}>
                <i className="bi bi-grid-1x2-fill"></i>
                {t('home.hero.view_dashboard', { defaultValue: 'Dash' })}
              </button>
            </div>
          </div>

          <div className="hm-hero-visual">
            <div className="hm-float-card hm-fc-1">
              <i className="bi bi-balance-scale"></i>
              <span>{t('home.hero.rights', { defaultValue: 'Know Your Rights' })}</span>
            </div>
            <div className="hm-float-card hm-fc-2">
              <i className="bi bi-hand-thumbs-up-fill"></i>
              <span>{t('home.hero.empower', { defaultValue: 'Get Empowered' })}</span>
            </div>
            <div className="hm-float-card hm-fc-3">
              <i className="bi bi-star-fill"></i>
              <span>{t('home.hero.grow', { defaultValue: 'Grow Together' })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="hm-stats">
        {stats.map((stat, idx) => (
          <FadeInOnScroll key={idx} direction="up" delay={idx * 100}>
            <div className="hm-stat-card">
              <i className={`bi ${stat.icon} hm-stat-icon`}></i>
              <div className="hm-stat-num">
                {stat.number === '24/7' ? '24/7' : <AnimatedCounter end={parseInt(stat.number) || 0} suffix={String(stat.number).includes('+') ? '+' : ''} duration={1800} />}
              </div>
              <div className="hm-stat-label">{stat.label}</div>
            </div>
          </FadeInOnScroll>
        ))}
      </section>

      {/* Features */}
      <section className="hm-features">
        <FadeInOnScroll direction="up">
          <div className="hm-section-header">
            <h2 className="hm-section-title">
              {t('home.features.title', { defaultValue: 'Why LR?' })}
            </h2>
            <p className="hm-section-sub">
              {t('home.features.subtitle', { defaultValue: 'Discover the features that make learning legal rights accessible and engaging.' })}
            </p>
          </div>
        </FadeInOnScroll>

        <div className="hm-features-grid">
          {features.map((f, idx) => (
            <FadeInOnScroll key={idx} direction="up" delay={idx * 150}>
              <div
                className={`hm-feature-card ${idx === currentFeature ? 'active' : ''}`}
                onClick={f.action}
              >
                <div className="hm-feature-icon" style={{ background: f.color }}>
                  <i className={`bi ${f.icon}`}></i>
                </div>
                <h3 className="hm-feature-title">{f.title}</h3>
                <p className="hm-feature-desc">{f.description}</p>
                <button className="hm-feature-btn" style={{ color: f.color }}>
                  {f.actionText} <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </FadeInOnScroll>
          ))}
        </div>

        <div className="hm-indicators">
          {features.map((_, idx) => (
            <button
              key={idx}
              className={`hm-dot ${idx === currentFeature ? 'active' : ''}`}
              onClick={() => setCurrentFeature(idx)}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="hm-cta">
        <div className="hm-cta-bg">
          <div className="hm-orb hm-orb-1"></div>
          <div className="hm-orb hm-orb-2"></div>
        </div>
        <FadeInOnScroll direction="scale">
          <div className="hm-cta-inner">
            <i className="bi bi-mortarboard-fill hm-cta-icon"></i>
            <h2 className="hm-cta-title">
              {t('home.cta.title', { defaultValue: 'Ready to Start Your Learning Journey?' })}
            </h2>
            <p className="hm-cta-desc">
              {t('home.cta.description', { defaultValue: 'Join thousands of women who are learning and exercising their rights every day.' })}
            </p>
            <div className="hm-cta-btns">
              <button className="hm-btn hm-btn-primary" onClick={() => navigate("/signup")}>
                <i className="bi bi-person-plus-fill"></i>
                {t('home.cta.join_now', { defaultValue: "Join Now - It's Free" })}
              </button>
              <button className="hm-btn hm-btn-outline" onClick={() => navigate("/login")}>
                <i className="bi bi-box-arrow-in-right"></i>
                {t('home.cta.sign_in', { defaultValue: 'Sign In' })}
              </button>
            </div>
          </div>
        </FadeInOnScroll>
      </section>
    </div>
  );
};

export default Home;