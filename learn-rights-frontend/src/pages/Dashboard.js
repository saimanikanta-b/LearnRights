import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { t } from '../utils/translation';
import { AnimatedCounter, FadeInOnScroll, StaggeredList } from "../components/AnimatedElements";
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Dashboard.css';
import { useUser } from "../contexts/UserContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, modules, progress, loading } = useUser();
  const [currentQuote, setCurrentQuote] = useState(0);

  const motivationalQuotes = [
    "Knowledge is power. Learn your rights to empower yourself.",
    "Every woman deserves to know her legal rights and protections.",
    "Your rights are your shield. Know them, use them, protect them.",
    "Empowered women empower communities."
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length), 5000);
    return () => clearInterval(interval);
  }, [motivationalQuotes.length]);

  const completedCount = progress?.completedModules?.length || 0;
  const totalPoints = user?.points || 0;
  const avgScore = user?.quizzes?.length ? Math.round(user.quizzes.reduce((s, q) => s + (q.score || 0), 0) / user.quizzes.length) : 0;

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p className="dash-loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  const metricCards = [
    { icon: "bi-book", value: completedCount, label: t("dashboard.modules_completed", { defaultValue: "Modules Completed" }) },
    { icon: "bi-star-fill", value: totalPoints, label: t("dashboard.total_points", { defaultValue: "Total Points" }) },
    { icon: "bi-bullseye", value: `${avgScore}%`, label: t("dashboard.average_score", { defaultValue: "Average Quiz Score" }) },
    { icon: "bi-trophy-fill", value: "—", label: t("dashboard.your_rank", { defaultValue: "Your Rank" }) }
  ];

  const quickActions = [
    { icon: "bi-play-circle-fill", label: t("dashboard.continue_learning", { defaultValue: "Continue Learning" }), path: "/modules" },
    { icon: "bi-chat-dots-fill", label: t("dashboard.ask_assistant", { defaultValue: "Ask Legal Assistant" }), path: "/chatbot" },
    { icon: "bi-bar-chart-fill", label: t("dashboard.view_leaderboard", { defaultValue: "View Leaderboard" }), path: "/leaderboard" },
    { icon: "bi-person-circle", label: t("dashboard.update_profile", { defaultValue: "Update Profile" }), path: "/profile" }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f0c29 0%, #1a1744 40%, #24243e 100%)', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* ── Welcome Banner ── */}
      <FadeInOnScroll direction="up" delay={0}>
        <div className="dash-banner">
          <h1 className="dash-banner-greeting">
            {t("dashboard.welcome", { defaultValue: "Welcome back" })}, {user?.name || "Learner"}! <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="dash-banner-sub">{t("dashboard.continue_journey", { defaultValue: "Continue your journey towards legal empowerment" })}</p>
          <p className="dash-banner-quote">"{motivationalQuotes[currentQuote]}"</p>
        </div>
      </FadeInOnScroll>

      {/* ── Metrics ── */}
      <div className="dash-metrics">
        {metricCards.map((item, i) => (
          <FadeInOnScroll key={i} direction="up" delay={i * 100}>
            <div className="dash-metric-card">
              <div className="dash-metric-icon">
                <i className={`bi ${item.icon}`}></i>
              </div>
              <div className="dash-metric-value">
                {typeof item.value === 'number' ? <AnimatedCounter end={item.value} duration={1500} /> : item.value}
              </div>
              <div className="dash-metric-label">{item.label}</div>
            </div>
          </FadeInOnScroll>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <FadeInOnScroll direction="up" delay={100}>
        <h3 className="dash-section-title">
          <i className="bi bi-lightning-charge-fill"></i>
          {t("dashboard.quick_actions", { defaultValue: "Quick Actions" })}
        </h3>
      </FadeInOnScroll>
      <div className="dash-actions">
        <StaggeredList staggerDelay={100}>
          {quickActions.map((action, i) => (
            <div key={i} className="dash-action-card" onClick={() => navigate(action.path)}>
              <div className="dash-action-icon">
                <i className={`bi ${action.icon}`}></i>
              </div>
              <span className="dash-action-label">{action.label}</span>
            </div>
          ))}
        </StaggeredList>
      </div>

      {/* ── Recent Progress ── */}
      <FadeInOnScroll direction="up" delay={150}>
        <h3 className="dash-section-title">
          <i className="bi bi-graph-up-arrow"></i>
          {t("dashboard.recent_progress", { defaultValue: "Recent Progress" })}
        </h3>
      </FadeInOnScroll>
      <div className="dash-progress-grid">
        {(modules || []).slice(0, 3).map((module) => {
          const isCompleted = progress?.completedModules?.some((id) => id.toString() === module._id.toString());
          const totalSub = module.topics?.reduce((acc, tp) => acc + (tp.subTopics?.length || 0), 0) || 0;
          const doneSub = progress?.completedSubTopics?.filter((id) =>
            module.topics?.some((topic) => topic.subTopics?.some((st) => (st._id || st.title) === id))
          ).length || 0;
          const pct = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;
          const status = isCompleted ? 'done' : pct > 0 ? 'progress' : 'new';
          const badgeLabel = isCompleted ? '✓ Completed' : pct > 0 ? 'In Progress' : 'Not Started';

          return (
            <div key={module._id} className="dash-progress-card">
              <div className="dash-progress-header">
                <h4 className="dash-progress-title">{module.title}</h4>
                <span className={`dash-progress-badge dash-badge-${status}`}>{badgeLabel}</span>
              </div>
              <div className="dash-progress-bar-wrap">
                <div className={`dash-progress-bar-fill dash-bar-${status}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="dash-progress-footer">
                <span className="dash-progress-pct">{pct}%</span>
                <span className="dash-progress-count">{doneSub}/{totalSub} subtopics</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Achievements ── */}
      <div className="dash-ach-header">
        <h3 className="dash-section-title">
          <i className="bi bi-award-fill"></i>
          {t("dashboard.achievements", { defaultValue: "Achievements" })}
        </h3>
        <button className="dash-ach-view-all" onClick={() => navigate('/achievements')}>
          View All <i className="bi bi-arrow-right"></i>
        </button>
      </div>
      <div className="dash-achievements">
        {/* Certificates */}
        {(progress?.certificates?.length > 0) && (
          <div className="dash-cert-list">
            {progress.certificates.map((cert, i) => (
              <div key={i} className="dash-cert-card" onClick={() => navigate('/achievements')}>
                <div className={`dash-cert-icon dash-cert-${cert.type}`}>
                  <i className={`bi ${cert.type === 'foundation' ? 'bi-shield-check' : cert.type === 'intermediate' ? 'bi-star-fill' : cert.type === 'advanced' ? 'bi-trophy-fill' : 'bi-gem'}`}></i>
                </div>
                <div className="dash-cert-info">
                  <span className="dash-cert-title">{cert.title}</span>
                  <span className="dash-cert-date">{cert.earnedAt ? new Date(cert.earnedAt).toLocaleDateString() : ''}</span>
                </div>
                <i className="bi bi-chevron-right dash-cert-arrow"></i>
              </div>
            ))}
          </div>
        )}
        {/* Badges */}
        {user?.badges?.length ? (
          <div className="dash-badge-list">
            {user.badges.map((badge, i) => (
              <span key={i} className="dash-achieve-badge">
                <i className="bi bi-trophy-fill"></i>
                {badge}
              </span>
            ))}
          </div>
        ) : (
          !progress?.certificates?.length && (
            <div className="dash-no-achievements">
              <i className="bi bi-emoji-smile"></i>
              <p>{t("dashboard.no_achievements", { defaultValue: "Complete modules and quizzes to earn certificates!" })}</p>
            </div>
          )
        )}
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
