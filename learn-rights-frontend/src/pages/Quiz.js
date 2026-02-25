import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { t, getLanguage, onTranslationChange } from '../utils/translation';
import { useUser } from '../contexts/UserContext';
import { saveQuizQuestions, getQuizQuestions } from '../utils/offlineDB';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Quiz.css';

const MOD_ICONS = {
  'MOD-01': 'bi-shield-check',
  'MOD-02': 'bi-heart-half',
  'MOD-03': 'bi-shield-exclamation',
  'MOD-04': 'bi-briefcase',
  'MOD-05': 'bi-house-door',
  'MOD-06': 'bi-bank',
  'MOD-07': 'bi-balance-scale',
  'MOD-08': 'bi-globe2',
};

const MOD_COLORS = {
  'MOD-01': '#7c3aed',
  'MOD-02': '#ec4899',
  'MOD-03': '#ef4444',
  'MOD-04': '#f59e0b',
  'MOD-05': '#10b981',
  'MOD-06': '#3b82f6',
  'MOD-07': '#6366f1',
  'MOD-08': '#8b5cf6',
};

const Quiz = () => {
  const { userId, modules: ctxModules, progress, refreshUserData } = useUser();
  const [modules, setModules] = useState([]);
  const [view, setView] = useState('select'); // select | quiz | result
  const [selectedModule, setSelectedModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const lang = getLanguage();

  // Load modules
  useEffect(() => {
    if (ctxModules && ctxModules.length > 0) {
      setModules(ctxModules);
    } else {
      const fetchModules = async () => {
        try {
          const langParam = lang && lang !== 'en' ? `?lang=${lang}` : '';
          const res = await axios.get(`/modules/${langParam}`);
          setModules(res.data || []);
        } catch (e) {
          console.error('Failed to fetch modules', e);
        }
      };
      fetchModules();
    }
  }, [ctxModules, lang]);

  // Listen for language changes
  useEffect(() => {
    const unsub = onTranslationChange(() => {
      if (view === 'select') {
        // modules will auto-refresh via context
      }
    });
    return () => unsub();
  }, [view]);

  // Check which modules are completed — all subtopics must be done
  const isModuleCompleted = useCallback((mod) => {
    if (!progress?.completedModules) return false;
    return progress.completedModules.some(id => id?.toString() === mod._id?.toString());
  }, [progress]);

  // Calculate module subtopic completion percentage
  const getModulePercent = useCallback((mod) => {
    if (!mod.topics || !progress?.completedSubTopics) return 0;
    let total = 0, done = 0;
    mod.topics.forEach(t2 => {
      (t2.subTopics || []).forEach(st => {
        total++;
        if (progress.completedSubTopics.includes(st._id || st.title)) done++;
      });
    });
    return total ? Math.round((done / total) * 100) : 0;
  }, [progress]);

  // Start quiz for a module
  const startQuiz = async (mod) => {
    setError('');
    setLoading(true);
    try {
      const langParam = lang && lang !== 'en' ? `&lang=${lang}` : '';
      const res = await axios.get(`/quizzes/module?moduleId=${mod._id}${langParam}`);
      const quiz = res.data[0];
      if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        setError(t('quiz.no_questions', { defaultValue: 'No questions available for this module.' }));
        setLoading(false);
        return;
      }
      // Cache quiz questions for offline use
      saveQuizQuestions(mod._id, quiz.questions).catch(() => {});
      setSelectedModule(mod);
      setQuestions(quiz.questions);
      setCurrentQ(0);
      setAnswers({});
      setQuizResult(null);
      setView('quiz');
    } catch (e) {
      // Offline fallback: load cached quiz questions
      if (!navigator.onLine) {
        try {
          const cached = await getQuizQuestions(mod._id);
          if (cached && cached.length > 0) {
            setSelectedModule(mod);
            setQuestions(cached);
            setCurrentQ(0);
            setAnswers({});
            setQuizResult(null);
            setView('quiz');
            setLoading(false);
            return;
          }
        } catch (dbErr) { /* ignore */ }
      }
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Select an answer
  const selectAnswer = (qIndex, optIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  // Submit quiz
  const submitQuiz = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError(t('quiz.answer_all', { defaultValue: 'Please answer all questions before submitting.' }));
      return;
    }
    setSubmitting(true);
    setError('');
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    const score = correct * 10;
    const totalMarks = questions.length * 10;
    const passMarks = Math.ceil(totalMarks * 0.6);
    const passed = score >= passMarks;

    try {
      const res = await axios.post('/progress/submit-quiz', {
        userId,
        moduleId: selectedModule._id,
        score,
        totalQuestions: questions.length,
      });
      setQuizResult({
        correct,
        total: questions.length,
        score,
        totalMarks,
        passed,
        pointsEarned: res.data.pointsEarned || 0,
      });
      setView('result');
      if (refreshUserData) refreshUserData();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Go back to module selection
  const goBack = () => {
    setView('select');
    setSelectedModule(null);
    setQuestions([]);
    setCurrentQ(0);
    setAnswers({});
    setQuizResult(null);
    setError('');
  };

  // ─── MODULE SELECTION VIEW ────────────────────────────────────────
  if (view === 'select') {
    return (
      <div className="qz-page">
        <div className="qz-container">
          {/* Hero */}
          <div className="qz-hero">
            <div className="qz-hero-icon-wrap">
              <i className="bi bi-pencil-square"></i>
            </div>
            <h1 className="qz-page-title">{t('quiz.title', { defaultValue: 'Module Quizzes' })}</h1>
            <p className="qz-page-subtitle">{t('quiz.subtitle', { defaultValue: 'Test your knowledge on Indian women\'s legal rights!' })}</p>
          </div>

          {error && (
            <div className="qz-error">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
              <button onClick={() => setError('')}><i className="bi bi-x"></i></button>
            </div>
          )}

          {/* Module Grid */}
          <div className="qz-module-grid">
            {modules.map((mod) => {
              const code = mod.code || '';
              const icon = MOD_ICONS[code] || 'bi-book';
              const color = MOD_COLORS[code] || '#7c3aed';
              const completed = isModuleCompleted(mod);
              const pct = getModulePercent(mod);

              return (
                <div
                  key={mod._id}
                  className={`qz-module-card ${completed ? 'qz-unlocked' : 'qz-locked'}`}
                  onClick={() => completed ? startQuiz(mod) : setError(t('quiz.module_not_completed', { defaultValue: 'Complete all subtopics in this module first.' }))}
                >
                  <div className="qz-mod-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
                    <i className={`bi ${icon}`}></i>
                  </div>
                  <div className="qz-mod-info">
                    <h3 className="qz-mod-title">{mod.title}</h3>
                    <div className="qz-mod-progress-bar">
                      <div className="qz-mod-progress-fill" style={{ width: `${pct}%`, background: color }}></div>
                    </div>
                    <span className="qz-mod-status">
                      {completed
                        ? <><i className="bi bi-unlock-fill"></i> {t('quiz.ready', { defaultValue: 'Quiz Ready' })}</>
                        : <><i className="bi bi-lock-fill"></i> {pct}% {t('quiz.completed_label', { defaultValue: 'completed' })}</>
                      }
                    </span>
                  </div>
                  {completed && <i className="bi bi-chevron-right qz-mod-arrow"></i>}
                  {loading && selectedModule?._id === mod._id && (
                    <div className="qz-mod-loading"><div className="qz-spinner-sm"></div></div>
                  )}
                </div>
              );
            })}
          </div>

          {modules.length === 0 && (
            <div className="qz-empty">
              <i className="bi bi-journal-x"></i>
              <p>{t('quiz.no_modules', { defaultValue: 'No modules available.' })}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── QUIZ VIEW ────────────────────────────────────────────────────
  if (view === 'quiz') {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const answered = answers[currentQ] !== undefined;

    return (
      <div className="qz-page">
        <div className="qz-container qz-quiz-container">
          {/* Quiz Header */}
          <div className="qz-quiz-header">
            <button className="qz-back-btn" onClick={goBack}>
              <i className="bi bi-arrow-left"></i>
            </button>
            <div className="qz-quiz-meta">
              <h2 className="qz-quiz-title">{selectedModule?.title}</h2>
              <span className="qz-quiz-count">
                {t('quiz.question_of', { defaultValue: 'Question' })} {currentQ + 1}/{questions.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="qz-progress-track">
            <div className="qz-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>

          {/* Question dots */}
          <div className="qz-dots">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`qz-dot ${i === currentQ ? 'qz-dot-active' : ''} ${answers[i] !== undefined ? 'qz-dot-answered' : ''}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {error && (
            <div className="qz-error">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
              <button onClick={() => setError('')}><i className="bi bi-x"></i></button>
            </div>
          )}

          {/* Question Card */}
          <div className="qz-question-card">
            <div className="qz-q-number">Q{currentQ + 1}</div>
            <p className="qz-q-text">{q.question}</p>
            <div className="qz-options">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={`qz-option ${answers[currentQ] === idx ? 'qz-option-selected' : ''}`}
                  onClick={() => selectAnswer(currentQ, idx)}
                >
                  <span className="qz-option-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className="qz-option-text">{opt}</span>
                  {answers[currentQ] === idx && <i className="bi bi-check-circle-fill qz-option-check"></i>}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="qz-nav">
            <button
              className="qz-nav-btn qz-nav-prev"
              onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
              disabled={currentQ === 0}
            >
              <i className="bi bi-chevron-left"></i> {t('quiz.prev', { defaultValue: 'Previous' })}
            </button>

            {currentQ < questions.length - 1 ? (
              <button
                className="qz-nav-btn qz-nav-next"
                onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={!answered}
              >
                {t('quiz.next', { defaultValue: 'Next' })} <i className="bi bi-chevron-right"></i>
              </button>
            ) : (
              <button
                className="qz-nav-btn qz-submit-btn"
                onClick={submitQuiz}
                disabled={submitting || Object.keys(answers).length < questions.length}
              >
                {submitting ? (
                  <><div className="qz-spinner-sm"></div> {t('quiz.submitting', { defaultValue: 'Submitting...' })}</>
                ) : (
                  <><i className="bi bi-check2-all"></i> {t('quiz.submit', { defaultValue: 'Submit Quiz' })}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT VIEW ──────────────────────────────────────────────────
  if (view === 'result' && quizResult) {
    const { correct, total, score, totalMarks, passed, pointsEarned } = quizResult;
    const pct = Math.round((correct / total) * 100);
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F';
    const gradeColor = pct >= 90 ? '#10b981' : pct >= 80 ? '#34d399' : pct >= 70 ? '#f59e0b' : pct >= 60 ? '#fb923c' : '#ef4444';
    const modColor = MOD_COLORS[selectedModule?.code] || '#7c3aed';
    const modIcon = MOD_ICONS[selectedModule?.code] || 'bi-book';

    return (
      <div className="qz-page">
        {/* Confetti particles */}
        {passed && (
          <div className="qz-confetti-container">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="qz-confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: ['#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#a78bfa', '#6ee7b7', '#fbbf24'][i % 8],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
              }} />
            ))}
          </div>
        )}

        <div className="qz-container qz-result-container">
          {/* Main Result Card */}
          <div className={`qz-result-card ${passed ? 'qz-passed' : 'qz-failed'}`}>
            
            {/* Glowing result badge */}
            <div className="qz-result-badge-wrap">
              <div className={`qz-result-badge ${passed ? 'qz-badge-pass' : 'qz-badge-fail'}`}>
                <div className="qz-badge-glow"></div>
                <i className={`bi ${passed ? 'bi-trophy-fill' : 'bi-arrow-repeat'}`}></i>
              </div>
            </div>

            <h2 className="qz-result-title">
              {passed
                ? t('quiz.congratulations', { defaultValue: 'Congratulations!' })
                : t('quiz.try_again_title', { defaultValue: 'Keep Learning!' })
              }
            </h2>
            <p className="qz-result-subtitle">
              {passed
                ? t('quiz.passed_msg', { defaultValue: 'You passed the quiz! Great job!' })
                : t('quiz.failed_msg', { defaultValue: 'You need 60% to pass. Review the module and try again.' })
              }
            </p>

            {/* Big Score Display */}
            <div className="qz-score-showcase">
              <div className="qz-score-ring-outer">
                <svg viewBox="0 0 160 160" className="qz-score-svg">
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={passed ? '#10b981' : '#ef4444'} />
                      <stop offset="100%" stopColor={passed ? '#34d399' : '#f87171'} />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r="68" className="qz-ring-bg" />
                  <circle cx="80" cy="80" r="68" className="qz-ring-progress" 
                    stroke="url(#scoreGrad)"
                    strokeDasharray={`${(pct / 100) * 427.26} 427.26`}
                  />
                </svg>
                <div className="qz-score-inner">
                  <span className="qz-score-pct">{pct}%</span>
                  <span className="qz-score-label">{t('quiz.score_label', { defaultValue: 'Score' })}</span>
                </div>
              </div>

              {/* Grade Badge */}
              <div className="qz-grade-badge" style={{ background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}dd)` }}>
                <span className="qz-grade-letter">{grade}</span>
                <span className="qz-grade-label">{t('quiz.grade', { defaultValue: 'Grade' })}</span>
              </div>
            </div>

            {/* Score Breakdown Cards */}
            <div className="qz-score-cards">
              <div className="qz-scard qz-scard-correct">
                <div className="qz-scard-icon"><i className="bi bi-check-circle-fill"></i></div>
                <div className="qz-scard-val">{correct}<span>/{total}</span></div>
                <div className="qz-scard-label">{t('quiz.correct', { defaultValue: 'Correct' })}</div>
              </div>
              <div className="qz-scard qz-scard-marks">
                <div className="qz-scard-icon"><i className="bi bi-star-fill"></i></div>
                <div className="qz-scard-val">{score}<span>/{totalMarks}</span></div>
                <div className="qz-scard-label">{t('quiz.marks', { defaultValue: 'Marks' })}</div>
              </div>
              <div className="qz-scard qz-scard-wrong">
                <div className="qz-scard-icon"><i className="bi bi-x-circle-fill"></i></div>
                <div className="qz-scard-val">{total - correct}<span>/{total}</span></div>
                <div className="qz-scard-label">{t('quiz.wrong', { defaultValue: 'Wrong' })}</div>
              </div>
              {pointsEarned > 0 && (
                <div className="qz-scard qz-scard-points">
                  <div className="qz-scard-icon"><i className="bi bi-lightning-charge-fill"></i></div>
                  <div className="qz-scard-val">+{pointsEarned}</div>
                  <div className="qz-scard-label">{t('quiz.points', { defaultValue: 'Points' })}</div>
                </div>
              )}
            </div>

            {/* Module info bar */}
            <div className="qz-result-module-bar" style={{ borderColor: `${modColor}44` }}>
              <div className="qz-result-mod-icon" style={{ background: modColor }}>
                <i className={`bi ${modIcon}`}></i>
              </div>
              <div className="qz-result-mod-info">
                <span className="qz-result-mod-name">{selectedModule?.title}</span>
                <span className="qz-result-mod-status">
                  {passed
                    ? <><i className="bi bi-patch-check-fill" style={{ color: '#10b981' }}></i> {t('quiz.quiz_passed', { defaultValue: 'Quiz Passed' })}</>
                    : <><i className="bi bi-exclamation-circle-fill" style={{ color: '#ef4444' }}></i> {t('quiz.quiz_failed', { defaultValue: 'Not Passed' })}</>
                  }
                </span>
              </div>
            </div>

            {/* Review Answers */}
            <div className="qz-review">
              <h3 className="qz-review-title">
                <i className="bi bi-list-check"></i> {t('quiz.review', { defaultValue: 'Review Answers' })}
              </h3>
              {questions.map((q, i) => {
                const userAns = answers[i];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={i} className={`qz-review-item ${isCorrect ? 'qz-review-correct' : 'qz-review-wrong'}`}>
                    <div className="qz-review-q">
                      <span className="qz-review-num">Q{i + 1}</span>
                      <span>{q.question}</span>
                      <i className={`bi ${isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                    </div>
                    {!isCorrect && (
                      <div className="qz-review-answer">
                        <span className="qz-review-your"><i className="bi bi-x"></i> {t('quiz.your_answer', { defaultValue: 'Your answer' })}: {q.options[userAns]}</span>
                        <span className="qz-review-right"><i className="bi bi-check"></i> {t('quiz.correct_answer', { defaultValue: 'Correct' })}: {q.options[q.correctAnswer]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="qz-result-actions">
              <button className="qz-action-btn qz-retry-btn" onClick={() => startQuiz(selectedModule)}>
                <i className="bi bi-arrow-repeat"></i> {t('quiz.retry', { defaultValue: 'Retake Quiz' })}
              </button>
              <button className="qz-action-btn qz-back-module-btn" onClick={goBack}>
                <i className="bi bi-grid-3x3-gap"></i> {t('quiz.all_quizzes', { defaultValue: 'All Quizzes' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;