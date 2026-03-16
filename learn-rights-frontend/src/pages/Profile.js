import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import axios from "../api/axios";
import "../styles/Profile.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { t } from '../utils/translation';

const API_BASE = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const Profile = () => {
  const { user, userId, modules, progress, loading, refreshUserData } = useUser();
  const [activeTab, setActiveTab] = useState("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setMobile(user.mobile ?? "");
    setPreferredLanguage(user.preferredLanguage ?? "en");
    setShowOnLeaderboard(!!user.showOnLeaderboard);
    setEmailNotifications(user.emailNotifications !== false);
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePhoto", file);
      await axios.post(`/profile/${userId}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUserData();
    } catch (err) {
      setUploadError(err.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    if (!userId || !user?.profilePhoto) return;
    setUploadError("");
    setUploading(true);
    try {
      await axios.delete(`/profile/${userId}/photo`);
      await refreshUserData();
    } catch (err) {
      setUploadError(err.response?.data?.detail || err.message || "Delete failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);
    try {
      await axios.put(`/profile/${userId}`, {
        name: name || undefined,
        email: email || undefined,
        mobile: mobile || undefined,
        preferredLanguage: preferredLanguage || undefined,
        showOnLeaderboard,
        emailNotifications,
      });
      await refreshUserData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.detail || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pf-page">
        <div className="pf-loading">
          <div className="pf-spinner" />
          <p className="pf-loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "personal", icon: "bi-person-fill", label: t("profile.tabs.personal", { defaultValue: "Personal Info" }) },
    { key: "progress", icon: "bi-graph-up-arrow", label: t("profile.tabs.progress", { defaultValue: "Progress" }) },
    { key: "achievements", icon: "bi-trophy-fill", label: t("profile.tabs.achievements", { defaultValue: "Achievements" }) },
  ];

  return (
    <div className="pf-page">
      <div className="pf-container">
        {/* ── Profile Header Card ── */}
        <div className="pf-header-card">
          <div className="pf-banner">
            <div className="pf-banner-orb pf-orb-1" />
            <div className="pf-banner-orb pf-orb-2" />
          </div>
          <div className="pf-header-body">
            {/* Avatar */}
            <div className="pf-avatar-wrap">
              {user?.profilePhoto ? (
                <img src={`${API_BASE}${user.profilePhoto}`} alt="Profile" className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-placeholder">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <label htmlFor="pf-photo-input" className="pf-avatar-upload" title={t("profile.change_photo", { defaultValue: "Change photo" })}>
                {uploading ? (
                  <div className="pf-upload-spinner" />
                ) : (
                  <i className="bi bi-camera-fill"></i>
                )}
              </label>
              <input type="file" accept="image/*" id="pf-photo-input" onChange={handlePhotoChange} disabled={uploading} className="pf-file-hidden" />
              {user?.profilePhoto && (
                <button
                  type="button"
                  className="pf-avatar-delete"
                  title={t("profile.delete_photo", { defaultValue: "Remove photo" })}
                  onClick={handlePhotoDelete}
                  disabled={uploading}
                >
                  <i className="bi bi-trash-fill"></i>
                </button>
              )}
            </div>
            {uploadError && <p className="pf-upload-error">{uploadError}</p>}

            <h2 className="pf-name">{user?.name || t("profile.default_name", { defaultValue: "Learner" })}</h2>
            <p className="pf-email">{user?.email || user?.mobile || ""}</p>

            {/* Stats Row */}
            <div className="pf-stats-row">
              <div className="pf-stat-card pf-stat-purple">
                <i className="bi bi-gem"></i>
                <span className="pf-stat-value">{user?.points || 0}</span>
                <span className="pf-stat-label">{t("profile.points", { defaultValue: "Points" })}</span>
              </div>
              <div className="pf-stat-card pf-stat-blue">
                <i className="bi bi-journal-bookmark-fill"></i>
                <span className="pf-stat-value">{user?.completedModules?.length || 0}</span>
                <span className="pf-stat-label">{t("profile.modules", { defaultValue: "Modules" })}</span>
              </div>
              <div className="pf-stat-card pf-stat-amber">
                <i className="bi bi-trophy-fill"></i>
                <span className="pf-stat-value">{user?.badges?.length || 0}</span>
                <span className="pf-stat-label">{t("profile.badges", { defaultValue: "Badges" })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="pf-tabs-card">
          <div className="pf-tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`pf-tab-btn ${activeTab === tab.key ? 'pf-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`bi ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="pf-tab-content">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <form onSubmit={handleSaveProfile} className="pf-form">
                <div className="pf-form-grid">
                  <div className="pf-form-group">
                    <label className="pf-label">{t("profile.fields.name", { defaultValue: "Full Name" })}</label>
                    <input type="text" className="pf-input" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder={t("profile.fields.name", { defaultValue: "Full Name" })} />
                  </div>
                  <div className="pf-form-group">
                    <label className="pf-label">{t("profile.fields.email", { defaultValue: "Email" })}</label>
                    <input type="email" className="pf-input" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com" />
                  </div>
                  <div className="pf-form-group">
                    <label className="pf-label">{t("profile.fields.mobile", { defaultValue: "Mobile" })}</label>
                    <input type="text" className="pf-input" value={mobile} onChange={(e) => setMobile(e.target.value)}
                      placeholder={t("profile.fields.mobile", { defaultValue: "Mobile" })} />
                  </div>
                  <div className="pf-form-group">
                    <label className="pf-label">{t("profile.fields.language", { defaultValue: "Language" })}</label>
                    <input type="text" className="pf-input" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}
                      placeholder="en" />
                  </div>
                </div>

                <div className="pf-preferences">
                  <h4 className="pf-pref-title">{t("profile.preferences", { defaultValue: "Preferences" })}</h4>
                  <label className="pf-checkbox-wrap">
                    <input type="checkbox" checked={showOnLeaderboard} onChange={(e) => setShowOnLeaderboard(e.target.checked)} className="pf-checkbox" />
                    <span>{t("profile.show_on_leaderboard", { defaultValue: "Show my progress on leaderboard" })}</span>
                  </label>
                  <label className="pf-checkbox-wrap">
                    <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="pf-checkbox" />
                    <span>{t("profile.email_notifications", { defaultValue: "Receive email updates" })}</span>
                  </label>
                </div>

                <div className="pf-save-row">
                  <button type="submit" className="pf-save-btn" disabled={saving}>
                    {saving && <div className="pf-btn-spinner" />}
                    <i className="bi bi-check2-circle"></i>
                    {t("profile.save", { defaultValue: "Save" })}
                  </button>
                  {saveSuccess && <span className="pf-save-success"><i className="bi bi-check-circle-fill"></i> {t("profile.saved", { defaultValue: "Saved." })}</span>}
                  {saveError && <span className="pf-save-error"><i className="bi bi-exclamation-circle-fill"></i> {saveError}</span>}
                </div>
              </form>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <div className="pf-progress-tab">
                <div className="pf-progress-summary">
                  <div className="pf-summary-card">
                    <i className="bi bi-journal-check"></i>
                    <span className="pf-summary-val">{user?.completedModules?.length || 0}</span>
                    <span className="pf-summary-label">{t("profile.progress.completed_modules", { defaultValue: "Completed Modules" })}</span>
                  </div>
                  <div className="pf-summary-card">
                    <i className="bi bi-pencil-square"></i>
                    <span className="pf-summary-val">{user?.quizzes?.length || 0}</span>
                    <span className="pf-summary-label">{t("profile.progress.quizzes_taken", { defaultValue: "Quizzes Taken" })}</span>
                  </div>
                  <div className="pf-summary-card">
                    <i className="bi bi-gem"></i>
                    <span className="pf-summary-val">{user?.points || 0}</span>
                    <span className="pf-summary-label">{t("profile.progress.total_points", { defaultValue: "Total Points" })}</span>
                  </div>
                </div>

                <h4 className="pf-section-heading">
                  <i className="bi bi-bar-chart-fill"></i>
                  {t("profile.progress.module_progress", { defaultValue: "Module Progress" })}
                </h4>
                <div className="pf-modules-scroll">
                  {(modules || []).map((module) => {
                    const isCompleted = progress?.completedModules?.some((id) => id.toString() === module._id?.toString());
                    const totalSub = module.topics?.reduce((acc, topic) => acc + (topic.subTopics?.length || 0), 0) || 0;
                    const doneSub = progress?.completedSubTopics?.filter((id) => module.topics?.some((topic) => topic.subTopics?.some((st) => (st._id || st.title) === id)))?.length || 0;
                    const pct = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;
                    const status = isCompleted ? 'done' : pct > 0 ? 'progress' : 'new';
                    const badgeLabel = isCompleted ? '✓ Done' : pct > 0 ? 'In progress' : 'Not started';

                    return (
                      <div key={module._id} className="pf-module-card">
                        <div className="pf-module-header">
                          <h5 className="pf-module-name">{module.title}</h5>
                          <span className={`pf-module-badge pf-mbadge-${status}`}>{badgeLabel}</span>
                        </div>
                        <div className="pf-bar-wrap">
                          <div className={`pf-bar-fill pf-barfill-${status}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="pf-module-sub">{doneSub}/{totalSub} {t("profile.progress.subtopics", { defaultValue: "subtopics" })} — {pct}%</span>
                      </div>
                    );
                  })}
                </div>
                {(!modules || modules.length === 0) && (
                  <p className="pf-empty-text">{t("profile.progress.no_modules", { defaultValue: "No modules available yet." })}</p>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div className="pf-achievements-tab">
                {user?.badges?.length ? (
                  <div className="pf-badge-grid">
                    {user.badges.map((badge, i) => (
                      <div key={i} className="pf-achieve-card">
                        <i className="bi bi-trophy-fill"></i>
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pf-empty-achievements">
                    <i className="bi bi-emoji-smile"></i>
                    <p>{t("profile.achievements.keep_learning", { defaultValue: "Complete modules and quizzes to earn your first badge!" })}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
