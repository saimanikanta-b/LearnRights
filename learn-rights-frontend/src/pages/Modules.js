import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../api/axios";
import { t, getLanguage, onTranslationChange } from '../utils/translation';
import { useUser } from "../contexts/UserContext";
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../styles/Modules.css";

const REQUIRED_READING_SECONDS = 300; // 5 minutes

/* ── icon/color fallbacks ── */
const MOD_ICONS = {
  "MOD-01": "bi-bank2",       "MOD-02": "bi-heart-fill",
  "MOD-03": "bi-shield-fill-check", "MOD-04": "bi-briefcase-fill",
  "MOD-05": "bi-house-fill",  "MOD-06": "bi-award-fill",
  "MOD-07": "bi-megaphone-fill", "MOD-08": "bi-globe2",
};
const MOD_COLORS = {
  "MOD-01": "#7c3aed", "MOD-02": "#ec4899", "MOD-03": "#ef4444",
  "MOD-04": "#f59e0b", "MOD-05": "#10b981", "MOD-06": "#06b6d4",
  "MOD-07": "#8b5cf6", "MOD-08": "#f43f5e",
};

/* ── helper: render content with formatting ── */
const RichContent = ({ text }) => {
  if (!text) return <p className="mod-content-body">Content not available.</p>;
  const lines = text.split('\n');
  return (
    <div className="mod-rich-content">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="mod-rich-spacer" />;
        /* headings with emoji prefix */
        if (/^(📜|🔑|📋|🔴|📌|💡|🛡️|📞|📱|🏢|✅)/.test(trimmed)) {
          const isHighlight = /^💡/.test(trimmed);
          const isWarning = /^📌/.test(trimmed);
          const isStep = /^(📋|Step)/.test(trimmed);
          let cls = 'mod-rich-point';
          if (isHighlight) cls = 'mod-rich-tip';
          else if (isWarning) cls = 'mod-rich-case';
          else if (isStep) cls = 'mod-rich-step';
          return <div key={i} className={cls}>{trimmed}</div>;
        }
        if (trimmed.startsWith('•')) return <div key={i} className="mod-rich-bullet">{trimmed}</div>;
        if (trimmed.startsWith('Step ')) return <div key={i} className="mod-rich-step">{trimmed}</div>;
        return <p key={i} className="mod-rich-text">{trimmed}</p>;
      })}
    </div>
  );
};

const Modules = () => {
  const { userId, modules: ctxModules, progress, loading: ctxLoading, refreshUserData, updateProgressLocally } = useUser();
  const [localModules, setLocalModules] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [readingTimer, setReadingTimer] = useState(REQUIRED_READING_SECONDS);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef(null);

  /* Fallback: if UserContext has no modules (not logged in or fetch failed), load from /modules/ */
  const fetchModules = useCallback(() => {
    setLocalLoading(true);
    const lang = getLanguage();
    const langParam = lang && lang !== 'en' ? `?lang=${lang}` : '';
    axios.get(`/modules/${langParam}`)
      .then(res => setLocalModules(res.data))
      .catch(err => console.error("Failed to fetch modules:", err))
      .finally(() => setLocalLoading(false));
  }, []);

  useEffect(() => {
    if (!ctxLoading && (!ctxModules || ctxModules.length === 0)) {
      fetchModules();
    }
  }, [ctxLoading, ctxModules, fetchModules]);

  /* Re-fetch modules when language changes — works for both logged-in and fallback */
  useEffect(() => {
    const unsub = onTranslationChange(() => {
      // Always re-fetch fallback modules (for non-logged-in users)
      // For logged-in users, UserContext handles its own re-fetch
      if (!userId || !ctxModules || ctxModules.length === 0) {
        fetchModules();
      }
    });
    return () => unsub();
  }, [userId, ctxModules, fetchModules]);

  const rawModules = (ctxModules && ctxModules.length > 0) ? ctxModules : localModules;
  /* Sort modules by order field, then by code (MOD-01, MOD-02, ...) */
  const modules = [...rawModules].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    const codeA = a.code || ''; const codeB = b.code || '';
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });
  const loading = ctxLoading || localLoading;

  const handleModuleSelect = (m) => { setSelectedModule(m); setSelectedTopic(null); setSelectedSubTopic(null); };
  const handleTopicSelect = (topic) => { setSelectedTopic(topic); setSelectedSubTopic(null); };

  /* Start reading a subtopic — opens content, starts 5-min timer */
  const handleSubTopicSelect = (subTopic) => {
    setSelectedSubTopic(subTopic);
    // Reset timer if this subtopic is already completed
    const alreadyDone = isSubTopicCompleted(subTopic);
    if (alreadyDone) {
      setTimerDone(true);
      setReadingTimer(0);
    } else {
      setTimerDone(false);
      setReadingTimer(REQUIRED_READING_SECONDS);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  /* Timer countdown — runs when a subtopic is opened and not yet completed */
  useEffect(() => {
    if (!selectedSubTopic) return;
    if (timerDone || isSubTopicCompleted(selectedSubTopic)) return;

    timerRef.current = setInterval(() => {
      setReadingTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubTopic, timerDone]);

  /* Mark subtopic as completed — only callable after timer finishes */
  const markSubTopicComplete = async (subTopic) => {
    if (!userId) return;
    try {
      const subTopicId = subTopic._id || subTopic.title;
      const completeResponse = await axios.post("/progress/complete-subtopic", { userId, moduleId: selectedModule._id, subTopicId });
      updateProgressLocally({
        completedSubTopics: [...(progress.completedSubTopics || []), subTopicId],
        completedModules: completeResponse.data.progress.completedModules,
        points: completeResponse.data.progress.points,
        badges: completeResponse.data.progress.badges
      });
      await refreshUserData();
    } catch (err) { console.error(err); }
  };

  const handleQuizStart = (module) => { window.location.href = `/quiz?moduleId=${module._id}`; };
  const isSubTopicCompleted = (st) => progress?.completedSubTopics?.includes(st._id || st.title) ?? false;
  const isModuleCompleted = (m) => progress?.completedModules?.some((id) => id.toString() === m._id?.toString()) ?? false;

  const getModuleProgress = (m) => {
    const total = m.topics?.reduce((acc, topic) => acc + (topic.subTopics?.length || 0), 0) || 0;
    const done = progress?.completedSubTopics?.filter((id) => m.topics?.some((topic) => topic.subTopics?.some((st) => (st._id || st.title) === id)))?.length || 0;
    return total ? Math.round((done / total) * 100) : 0;
  };
  const getStatus = (m) => {
    const p = getModuleProgress(m);
    return p === 100 ? "completed" : p > 0 ? "in-progress" : "not-started";
  };
  const getIcon = (m) => m.icon || MOD_ICONS[m.code] || "bi-book-half";
  const getColor = (m) => m.color || MOD_COLORS[m.code] || "#7c3aed";

  const filteredModules = (modules || []).filter((m) => {
    const match = (m.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (m.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!match) return false;
    if (filterStatus === "all") return true;
    return getStatus(m) === filterStatus;
  });

  const statusConfig = {
    completed: { color: "#10b981", icon: "bi-check-circle-fill", label: "Completed" },
    "in-progress": { color: "#f59e0b", icon: "bi-clock-fill", label: "In Progress" },
    "not-started": { color: "#6366f1", icon: "bi-circle", label: "Not Started" }
  };

  const topicIcons = [
    "bi-journal-richtext", "bi-book-fill", "bi-file-earmark-text-fill",
    "bi-card-text", "bi-clipboard2-data-fill", "bi-bookmark-star-fill",
  ];

  /* Loading */
  if (loading) {
    return (
      <div className="mod-page">
        <div className="mod-loading">
          <div className="mod-spinner"></div>
          <p>{t("modules.loading", { defaultValue: "Loading modules..." })}</p>
        </div>
      </div>
    );
  }

  /* ═══════════════ MODULE LIST ═══════════════ */
  if (!selectedModule) {
    return (
      <div className="mod-page">
        <div className="mod-container">
          {/* Hero Header */}
          <div className="mod-hero">
            <div className="mod-hero-glow"></div>
            <div className="mod-header-icon"><i className="bi bi-book-half"></i></div>
            <h1 className="mod-title">{t("modules.title", { defaultValue: "Learning Modules" })}</h1>
            <p className="mod-subtitle">{t("modules.subtitle", { defaultValue: "Comprehensive legal education on Indian women's rights — empowering you with knowledge" })}</p>
            <div className="mod-stats-row">
              <div className="mod-stat-pill"><i className="bi bi-collection-fill"></i> {modules?.length || 0} Modules</div>
              <div className="mod-stat-pill"><i className="bi bi-layers-fill"></i> {modules?.reduce((a, m) => a + (m.topics?.length || 0), 0)} Topics</div>
              <div className="mod-stat-pill"><i className="bi bi-file-text-fill"></i> {modules?.reduce((a, m) => a + (m.topics?.reduce((b, t2) => b + (t2.subTopics?.length || 0), 0) || 0), 0)} Lessons</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mod-toolbar">
            <div className="mod-search-wrap">
              <i className="bi bi-search mod-search-icon"></i>
              <input type="search" className="mod-search" placeholder={t("modules.search_placeholder", { defaultValue: "Search modules..." })} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="mod-filters">
              {["all", "not-started", "in-progress", "completed"].map((s) => (
                <button key={s} className={`mod-filter-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {t(`modules.filters.${s.replace('-', '_')}`, { defaultValue: s === 'all' ? 'All' : s.replace('-', ' ') })}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filteredModules.length === 0 ? (
            <div className="mod-empty">
              <i className="bi bi-journal-x"></i>
              <h3>{t("modules.no_modules_found", { defaultValue: "No modules found" })}</h3>
              <p>{t("modules.try_different_search", { defaultValue: "Try different search or filters." })}</p>
            </div>
          ) : (
            <div className="mod-grid">
              {filteredModules.map((m) => {
                const status = getStatus(m);
                const prog = getModuleProgress(m);
                const sc = statusConfig[status];
                const color = getColor(m);
                const icon = getIcon(m);
                const topicCount = m.topics?.length || 0;
                const lessonCount = m.topics?.reduce((a, t2) => a + (t2.subTopics?.length || 0), 0) || 0;
                return (
                  <div key={m._id} className="mod-card" onClick={() => handleModuleSelect(m)}>
                    <div className="mod-card-accent" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}></div>
                    <div className="mod-card-top">
                      <div className="mod-card-icon-wrap" style={{ background: `${color}20`, color }}>
                        <i className={`bi ${icon}`}></i>
                      </div>
                      <span className="mod-status" style={{ color: sc.color }}>
                        <i className={`bi ${sc.icon}`}></i> {sc.label}
                      </span>
                    </div>
                    <span className="mod-code">{m.code}</span>
                    <h3 className="mod-card-title">{m.title}</h3>
                    <p className="mod-card-desc">{m.description}</p>
                    <div className="mod-card-meta-row">
                      <span className="mod-card-meta-item"><i className="bi bi-layers"></i> {topicCount} Topics</span>
                      <span className="mod-card-meta-item"><i className="bi bi-file-text"></i> {lessonCount} Lessons</span>
                    </div>
                    <div className="mod-progress-bar">
                      <div className="mod-progress-fill" style={{ width: `${prog}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}></div>
                    </div>
                    <div className="mod-card-footer">
                      <span className="mod-meta">{prog}% complete</span>
                      <button className="mod-start-btn" style={{ background: color }} onClick={(e) => { e.stopPropagation(); handleModuleSelect(m); }}>
                        {isModuleCompleted(m) ? ( <><i className="bi bi-arrow-repeat"></i> Review</> ) : ( <><i className="bi bi-play-fill"></i> Start</> )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════ TOPIC LIST ═══════════════ */
  if (!selectedTopic) {
    const color = getColor(selectedModule);
    const icon = getIcon(selectedModule);
    return (
      <div className="mod-page">
        <div className="mod-container">
          <button className="mod-back" onClick={() => setSelectedModule(null)}>
            <i className="bi bi-arrow-left"></i> {t("modules.back", { defaultValue: "Back to Modules" })}
          </button>

          {/* Module intro header */}
          <div className="mod-module-header">
            <div className="mod-module-icon" style={{ background: `${color}20`, color, boxShadow: `0 0 30px ${color}30` }}>
              <i className={`bi ${icon}`} style={{ fontSize: '2rem' }}></i>
            </div>
            <div>
              <span className="mod-code" style={{ marginBottom: 6, display: 'inline-block' }}>{selectedModule.code}</span>
              <h2 className="mod-view-title" style={{ marginBottom: 6 }}>{selectedModule.title}</h2>
              <p className="mod-subtitle" style={{ textAlign: 'left' }}>{selectedModule.description}</p>
            </div>
          </div>

          <div className="mod-grid mod-grid-2">
            {(selectedModule.topics || []).map((topic, idx) => {
              const tIcon = topicIcons[idx % topicIcons.length];
              const subCount = topic.subTopics?.length || 0;
              const doneSubs = topic.subTopics?.filter(st => isSubTopicCompleted(st)).length || 0;
              return (
                <div key={topic._id || topic.title} className="mod-card mod-topic-card" onClick={() => handleTopicSelect(topic)}>
                  <div className="mod-topic-icon" style={{ background: `${color}15`, color }}>
                    <i className={`bi ${tIcon}`}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="mod-card-title">{topic.title}</h3>
                    <div className="mod-topic-meta">
                      <span className="mod-topic-count"><i className="bi bi-file-text"></i> {subCount} lessons</span>
                      <span className="mod-topic-count"><i className="bi bi-check-circle"></i> {doneSubs}/{subCount} done</span>
                    </div>
                  </div>
                  <button className="mod-view-btn" style={{ background: `${color}20`, color }} onClick={(e) => { e.stopPropagation(); handleTopicSelect(topic); }}>
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sticky info note */}
          <div className="mod-sticky-note" style={{ marginTop: '1.5rem' }}>
            <div className="mod-sticky-icon"><i className="bi bi-info-circle-fill"></i></div>
            <div className="mod-sticky-text">
              <strong>{t("modules.quiz_note_title", { defaultValue: "Quiz Requirement" })}</strong>
              <span>{t("modules.quiz_note_desc", { defaultValue: "Complete all subtopics (minimum 5 minutes reading each) to unlock the module quiz. The quiz will test your understanding of the topics covered." })}</span>
            </div>
          </div>

          {isModuleCompleted(selectedModule) && (
            <button className="mod-quiz-btn" onClick={() => handleQuizStart(selectedModule)}>
              <i className="bi bi-pencil-square"></i> {t("modules.take_quiz", { defaultValue: "Take Quiz" })}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════ SUBTOPIC LIST ═══════════════ */
  if (!selectedSubTopic) {
    const color = getColor(selectedModule);
    return (
      <div className="mod-page">
        <div className="mod-container">
          <button className="mod-back" onClick={() => setSelectedTopic(null)}>
            <i className="bi bi-arrow-left"></i> {t("modules.back_to_topics", { defaultValue: "Back to Topics" })}
          </button>
          <h2 className="mod-view-title"><i className="bi bi-bookmark-fill" style={{ color }}></i> {selectedTopic.title}</h2>
          <p className="mod-subtitle" style={{ textAlign: 'left', marginBottom: 24 }}>
            {selectedModule.title} · {selectedTopic.subTopics?.length || 0} lessons
          </p>
          {/* Sticky info note */}
          <div className="mod-sticky-note">
            <div className="mod-sticky-icon"><i className="bi bi-clock-history"></i></div>
            <div className="mod-sticky-text">
              <strong>{t("modules.reading_note_title", { defaultValue: "Important: Minimum Reading Time" })}</strong>
              <span>{t("modules.reading_note_desc", { defaultValue: "Each lesson requires at least 5 minutes of reading before it can be marked as completed. Take your time to understand the content thoroughly." })}</span>
            </div>
          </div>
          <div className="mod-grid mod-grid-1">
            {(selectedTopic.subTopics || []).map((st, idx) => {
              const done = isSubTopicCompleted(st);
              return (
                <div key={st._id || st.title} className={`mod-card mod-sub-card ${done ? 'completed' : ''}`} onClick={() => handleSubTopicSelect(st)}>
                  <div className="mod-sub-num" style={done ? { background: `${color}25`, color } : {}}>
                    {done ? <i className="bi bi-check-lg"></i> : idx + 1}
                  </div>
                  <div className="mod-sub-content">
                    <h3 className="mod-card-title">{st.title}</h3>
                    <p className="mod-card-desc">{st.content ? st.content.substring(0, 120) + "..." : "Click to read"}</p>
                  </div>
                  <div className={`mod-sub-badge ${done ? 'done' : ''}`}>
                    <i className={`bi ${done ? 'bi-check-circle-fill' : 'bi-arrow-right-circle'}`}></i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════ SUBTOPIC CONTENT ═══════════════ */
  const color = getColor(selectedModule);
  const currentTopicSubs = selectedTopic.subTopics || [];
  const currentIdx = currentTopicSubs.findIndex(st => (st._id || st.title) === (selectedSubTopic._id || selectedSubTopic.title));
  const prevSub = currentIdx > 0 ? currentTopicSubs[currentIdx - 1] : null;
  const nextSub = currentIdx < currentTopicSubs.length - 1 ? currentTopicSubs[currentIdx + 1] : null;
  const alreadyCompleted = isSubTopicCompleted(selectedSubTopic);

  const timerMinutes = Math.floor(readingTimer / 60);
  const timerSeconds = readingTimer % 60;
  const timerPct = ((REQUIRED_READING_SECONDS - readingTimer) / REQUIRED_READING_SECONDS) * 100;

  return (
    <div className="mod-page">
      <div className="mod-container">
        <button className="mod-back" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setSelectedSubTopic(null); }}>
          <i className="bi bi-arrow-left"></i> {t("modules.back_to_subtopics", { defaultValue: "Back to Subtopics" })}
        </button>

        {/* Sticky Reading-Time Notice */}
        {!alreadyCompleted && (
          <div className="mod-reading-sticky">
            <div className="mod-reading-sticky-inner">
              <div className="mod-reading-timer-ring">
                <svg viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" className="mod-timer-ring-bg" />
                  <circle cx="22" cy="22" r="18" className={`mod-timer-ring-fill ${timerDone ? 'mod-timer-complete' : ''}`}
                    strokeDasharray={`${(timerPct / 100) * 113.1} 113.1`}
                  />
                </svg>
                <div className="mod-timer-icon">
                  {timerDone ? <i className="bi bi-check-lg"></i> : <i className="bi bi-hourglass-split"></i>}
                </div>
              </div>
              <div className="mod-reading-sticky-info">
                {timerDone ? (
                  <>
                    <strong className="mod-reading-ready">{t("modules.reading_done", { defaultValue: "Reading time complete!" })}</strong>
                    <span>{t("modules.can_mark", { defaultValue: "You can now mark this lesson as completed." })}</span>
                  </>
                ) : (
                  <>
                    <strong>{t("modules.reading_required", { defaultValue: "Minimum 5 minutes reading required" })}</strong>
                    <span className="mod-reading-countdown">
                      <i className="bi bi-clock"></i> {timerMinutes}:{timerSeconds.toString().padStart(2, '0')} {t("modules.remaining", { defaultValue: "remaining" })}
                    </span>
                  </>
                )}
              </div>
            </div>
            {/* progress bar */}
            <div className="mod-reading-progress-track">
              <div className={`mod-reading-progress-bar ${timerDone ? 'mod-reading-bar-done' : ''}`} style={{ width: `${timerPct}%` }}></div>
            </div>
          </div>
        )}

        <div className="mod-content-card">
          <div className="mod-content-header">
            <span className="mod-content-breadcrumb">
              <i className="bi bi-book-half" style={{ color }}></i> {selectedModule.title} · {selectedTopic.title}
            </span>
            <span className="mod-content-lesson-num" style={{ color }}>
              Lesson {currentIdx + 1} of {currentTopicSubs.length}
            </span>
          </div>
          <h2 className="mod-content-title">{selectedSubTopic.title}</h2>

          {/* Hero Image */}
          {selectedSubTopic.image && (
            <div className="mod-content-image-wrap">
              <img
                src={selectedSubTopic.image}
                alt={selectedSubTopic.title}
                className="mod-content-image"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }}
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <RichContent text={selectedSubTopic.content} />

          {/* Videos Section */}
          {selectedSubTopic.videos && selectedSubTopic.videos.length > 0 && (
            <div className="mod-media-section">
              <h3 className="mod-media-heading"><i className="bi bi-play-circle-fill"></i> Watch & Learn</h3>
              <div className="mod-videos-grid">
                {selectedSubTopic.videos.map((vid, i) => {
                  const videoId = vid.url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
                  return (
                    <div key={i} className="mod-video-card">
                      {videoId ? (
                        <iframe
                          className="mod-video-iframe"
                          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                          title={vid.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          frameBorder="0"
                        />
                      ) : (
                        <a href={vid.url} target="_blank" rel="noopener noreferrer" className="mod-video-fallback">
                          <i className="bi bi-play-circle"></i>
                        </a>
                      )}
                      <p className="mod-video-title">{vid.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reference Links Section */}
          {selectedSubTopic.links && selectedSubTopic.links.length > 0 && (
            <div className="mod-media-section">
              <h3 className="mod-media-heading"><i className="bi bi-link-45deg"></i> Reference Links</h3>
              <div className="mod-links-list">
                {selectedSubTopic.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="mod-link-card">
                    <div className="mod-link-icon"><i className="bi bi-box-arrow-up-right"></i></div>
                    <div className="mod-link-info">
                      <span className="mod-link-title">{link.title}</span>
                      <span className="mod-link-url">{link.url?.replace(/^https?:\/\//, '').substring(0, 50)}...</span>
                    </div>
                    <i className="bi bi-chevron-right mod-link-arrow"></i>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Completion */}
          <div className="mod-content-actions">
            {alreadyCompleted ? (
              <div className="mod-completed-msg">
                <i className="bi bi-patch-check-fill"></i>
                {t("modules.already_completed", { defaultValue: "You have completed this lesson!" })}
              </div>
            ) : timerDone ? (
              <button className="mod-mark-btn" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }} onClick={() => markSubTopicComplete(selectedSubTopic)}>
                <i className="bi bi-check2-all"></i> {t("modules.mark_completed", { defaultValue: "Mark as Completed" })}
              </button>
            ) : (
              <button className="mod-mark-btn mod-mark-disabled" disabled>
                <i className="bi bi-lock-fill"></i>
                <span>{t("modules.read_first", { defaultValue: "Read for" })} {timerMinutes}:{timerSeconds.toString().padStart(2, '0')} {t("modules.to_complete", { defaultValue: "to unlock" })}</span>
              </button>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div className="mod-content-nav">
            {prevSub ? (
              <button className="mod-nav-btn" onClick={() => handleSubTopicSelect(prevSub)}>
                <i className="bi bi-chevron-left"></i> {prevSub.title}
              </button>
            ) : <div />}
            {nextSub ? (
              <button className="mod-nav-btn mod-nav-next" onClick={() => handleSubTopicSelect(nextSub)}>
                {nextSub.title} <i className="bi bi-chevron-right"></i>
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modules;
