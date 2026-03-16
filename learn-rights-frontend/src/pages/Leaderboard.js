import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { t } from '../utils/translation';
import { useUser } from "../contexts/UserContext";
import { saveLeaderboard, getLeaderboard as getCachedLeaderboard } from "../utils/offlineDB";
import { FadeInOnScroll, AnimatedCounter } from "../components/AnimatedElements";
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Leaderboard.css';

const API_BASE = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const Leaderboard = () => {
  const { user: contextUser } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get("/leaderboard");
        setLeaderboard(response.data);
        // Cache for offline use
        saveLeaderboard(response.data).catch(() => {});
      } catch (err) {
        // Try offline cache
        if (!navigator.onLine) {
          try {
            const cached = await getCachedLeaderboard();
            if (cached && cached.length > 0) {
              setLeaderboard(cached);
              setIsOffline(true);
            } else {
              setError(t("leaderboard.error_offline", { defaultValue: "You are offline. Leaderboard data is not available yet." }));
            }
          } catch (dbErr) {
            setError(t("leaderboard.error_load", { defaultValue: "Failed to load leaderboard" }));
          }
        } else {
          setError(t("leaderboard.error_load", { defaultValue: "Failed to load leaderboard" }));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getLevel = (points) => {
    if (points >= 500) return { name: "Master", color: "#f43f5e", bg: "rgba(244,63,94,0.15)" };
    if (points >= 300) return { name: "Expert", color: "#f97316", bg: "rgba(249,115,22,0.15)" };
    if (points >= 150) return { name: "Advanced", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" };
    if (points >= 50)  return { name: "Intermediate", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
    return { name: "Beginner", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  };

  const getAvatar = (user) => {
    if (user.profilePhoto) return `${API_BASE}${user.profilePhoto}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=random&color=fff&size=80&bold=true&font-size=0.4`;
  };

  const currentUserId = contextUser?._id || contextUser?.id;

  if (loading) {
    return (
      <div className="lb-page">
        <div className="lb-loading">
          <div className="lb-spinner" />
          <p className="lb-loading-text">{t("leaderboard.loading", { defaultValue: "Loading leaderboard..." })}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lb-page">
        <div className="lb-error">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lb-page">
      <div className="lb-container">
        {isOffline && (
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 12, color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
            <i className="bi bi-wifi-off" style={{ marginRight: 6 }}></i>
            Showing cached leaderboard data
          </div>
        )}
        {/* Header */}
        <FadeInOnScroll direction="up" delay={0}>
          <div className="lb-header">
            <div className="lb-header-icon">
              <i className="bi bi-trophy-fill"></i>
            </div>
            <h1 className="lb-title">{t("leaderboard.title", { defaultValue: "Leaderboard" })}</h1>
            <p className="lb-subtitle">{t("leaderboard.subtitle", { defaultValue: "See how you rank among fellow learners!" })}</p>
          </div>
        </FadeInOnScroll>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <FadeInOnScroll direction="scale" delay={200}>
            <div className="lb-podium">
              {[1, 0, 2].map((idx) => {
                const u = leaderboard[idx];
                const rank = idx + 1;
                const medalClass = rank === 1 ? 'lb-gold' : rank === 2 ? 'lb-silver' : 'lb-bronze';
                const medalIcon = rank === 1 ? 'bi-trophy-fill' : rank === 2 ? 'bi-award-fill' : 'bi-star-fill';
                return (
                  <div key={u._id || idx} className={`lb-podium-card ${medalClass} ${rank === 1 ? 'lb-podium-first' : ''}`}>
                    <div className="lb-podium-medal">
                      <i className={`bi ${medalIcon}`}></i>
                    </div>
                    <img src={getAvatar(u)} alt="" className="lb-podium-avatar" />
                    <span className="lb-podium-rank">#{rank}</span>
                    <h4 className="lb-podium-name">{u.name}</h4>
                    <span className="lb-podium-points">
                      <i className="bi bi-gem"></i> <AnimatedCounter end={u.points || 0} duration={1500} />
                    </span>
                  </div>
                );
              })}
            </div>
          </FadeInOnScroll>
        )}

        {/* Table Header */}
        <div className="lb-table-header">
          <div className="lb-col-rank">{t("leaderboard.rank", { defaultValue: "Rank" })}</div>
          <div className="lb-col-player">{t("leaderboard.player", { defaultValue: "Player" })}</div>
          <div className="lb-col-level">{t("leaderboard.level", { defaultValue: "Level" })}</div>
          <div className="lb-col-points">{t("leaderboard.points", { defaultValue: "Points" })}</div>
          <div className="lb-col-modules">{t("leaderboard.modules_col", { defaultValue: "Modules" })}</div>
        </div>

        {/* Rows */}
        <div className="lb-rows">
          {leaderboard.map((u, i) => {
            const rank = i + 1;
            const level = getLevel(u.points || 0);
            const isCurrentUser = currentUserId && (u._id === currentUserId || u._id?.toString() === currentUserId?.toString());

            return (
              <FadeInOnScroll key={u._id || i} direction="left" delay={i * 60}>
                <div className={`lb-row ${isCurrentUser ? 'lb-row-you' : ''}`}>
                <div className="lb-col-rank">
                  {rank <= 3 ? (
                    <span className={`lb-rank-medal lb-rank-${rank}`}>{rank}</span>
                  ) : (
                    <span className="lb-rank-num">{rank}</span>
                  )}
                </div>
                <div className="lb-col-player">
                  <img src={getAvatar(u)} alt="" className="lb-row-avatar" />
                  <div className="lb-player-info">
                    <span className="lb-player-name">
                      {u.name}
                      {isCurrentUser && <span className="lb-you-badge">YOU</span>}
                    </span>
                    <span className="lb-player-mobile-stats">
                      <span style={{ color: level.color }}>{level.name}</span>
                      <span className="lb-dot">·</span>
                      <i className="bi bi-gem"></i> {u.points || 0}
                    </span>
                  </div>
                </div>
                <div className="lb-col-level">
                  <span className="lb-level-badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.color}30` }}>
                    {level.name}
                  </span>
                </div>
                <div className="lb-col-points">
                  <i className="bi bi-gem"></i> {u.points || 0}
                </div>
                <div className="lb-col-modules">
                  <i className="bi bi-journal-bookmark-fill"></i> {u.completedModules?.length || 0}
                </div>
              </div>
              </FadeInOnScroll>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="lb-empty">
            <i className="bi bi-emoji-smile"></i>
            <p>{t("leaderboard.no_data_message", { defaultValue: "Start learning to see your ranking here!" })}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
