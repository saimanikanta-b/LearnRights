import React, { useState, useRef, useCallback } from "react";
import { useUser } from "../contexts/UserContext";
import { t } from "../utils/translation";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/Achievements.css";

/* ── Certificate milestone definitions ── */
const MILESTONES = [
  { type: "foundation", title: "Foundation Certificate", modulesRequired: 2, color: "#38bdf8", gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)", icon: "bi-shield-check" },
  { type: "intermediate", title: "Intermediate Certificate", modulesRequired: 4, color: "#a78bfa", gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)", icon: "bi-star-fill" },
  { type: "advanced", title: "Advanced Certificate", modulesRequired: 6, color: "#f59e0b", gradient: "linear-gradient(135deg, #d97706, #f59e0b)", icon: "bi-trophy-fill" },
  { type: "expert", title: "Expert Certificate", modulesRequired: 8, color: "#ef4444", gradient: "linear-gradient(135deg, #dc2626, #f87171)", icon: "bi-gem" },
];

/* ── Draw certificate on canvas ── */
function drawCertificate(canvas, userName, certTitle, certType, date, modulesCompleted) {
  const ctx = canvas.getContext("2d");
  const W = 1200, H = 850;
  canvas.width = W;
  canvas.height = H;

  /* Background */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f0c29");
  bg.addColorStop(0.5, "#1a1744");
  bg.addColorStop(1, "#24243e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Border glow */
  const colors = { foundation: "#38bdf8", intermediate: "#a78bfa", advanced: "#f59e0b", expert: "#ef4444" };
  const accentColor = colors[certType] || "#a78bfa";
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(45, 45, W - 90, H - 90);

  /* Corner ornaments */
  const ornSize = 50;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  [[50, 50, 1, 1], [W - 50, 50, -1, 1], [50, H - 50, 1, -1], [W - 50, H - 50, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * ornSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * ornSize, y);
    ctx.stroke();
  });

  /* Top emblem circle */
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, 130, 45, 0, Math.PI * 2);
  const eg = ctx.createRadialGradient(W / 2, 130, 10, W / 2, 130, 45);
  eg.addColorStop(0, accentColor);
  eg.addColorStop(1, "rgba(124,58,237,0.3)");
  ctx.fillStyle = eg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  /* Emblem icon text (★) */
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px serif";
  ctx.textAlign = "center";
  ctx.fillText("★", W / 2, 143);

  /* "Certificate of Achievement" */
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 14px 'Segoe UI', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("CERTIFICATE OF ACHIEVEMENT", W / 2, 205);

  /* Certificate Title */
  ctx.fillStyle = accentColor;
  ctx.font = "bold 38px 'Georgia', serif";
  ctx.fillText(certTitle.toUpperCase(), W / 2, 260);

  /* Divider line */
  const lg = ctx.createLinearGradient(200, 285, W - 200, 285);
  lg.addColorStop(0, "transparent");
  lg.addColorStop(0.3, accentColor);
  lg.addColorStop(0.7, accentColor);
  lg.addColorStop(1, "transparent");
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 285);
  ctx.lineTo(W - 200, 285);
  ctx.stroke();

  /* "This is to certify that" */
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "italic 18px 'Georgia', serif";
  ctx.fillText("This is to certify that", W / 2, 330);

  /* User Name */
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 46px 'Georgia', serif";
  ctx.fillText(userName, W / 2, 390);

  /* Underline under name */
  const nameWidth = ctx.measureText(userName).width;
  const nlg = ctx.createLinearGradient(W / 2 - nameWidth / 2 - 20, 400, W / 2 + nameWidth / 2 + 20, 400);
  nlg.addColorStop(0, "transparent");
  nlg.addColorStop(0.2, accentColor);
  nlg.addColorStop(0.8, accentColor);
  nlg.addColorStop(1, "transparent");
  ctx.strokeStyle = nlg;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2 - 20, 405);
  ctx.lineTo(W / 2 + nameWidth / 2 + 20, 405);
  ctx.stroke();

  /* Description */
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "17px 'Segoe UI', sans-serif";
  ctx.fillText(`has successfully completed ${modulesCompleted} learning modules with passing quiz scores`, W / 2, 455);
  ctx.fillText("in the LearnRights Women's Legal Rights Education Program", W / 2, 480);

  /* Achievement level badge */
  const badgeY = 530;
  ctx.save();
  ctx.beginPath();
  const bw = 220, bh = 36, br = 18;
  ctx.moveTo(W / 2 - bw / 2 + br, badgeY - bh / 2);
  ctx.lineTo(W / 2 + bw / 2 - br, badgeY - bh / 2);
  ctx.quadraticCurveTo(W / 2 + bw / 2, badgeY - bh / 2, W / 2 + bw / 2, badgeY);
  ctx.quadraticCurveTo(W / 2 + bw / 2, badgeY + bh / 2, W / 2 + bw / 2 - br, badgeY + bh / 2);
  ctx.lineTo(W / 2 - bw / 2 + br, badgeY + bh / 2);
  ctx.quadraticCurveTo(W / 2 - bw / 2, badgeY + bh / 2, W / 2 - bw / 2, badgeY);
  ctx.quadraticCurveTo(W / 2 - bw / 2, badgeY - bh / 2, W / 2 - bw / 2 + br, badgeY - bh / 2);
  ctx.closePath();
  ctx.fillStyle = `${accentColor}33`;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = accentColor;
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.fillText(`${certType.toUpperCase()} LEVEL`, W / 2, badgeY + 5);

  /* Bottom divider */
  const blg = ctx.createLinearGradient(150, 590, W - 150, 590);
  blg.addColorStop(0, "transparent");
  blg.addColorStop(0.3, "rgba(255,255,255,0.15)");
  blg.addColorStop(0.7, "rgba(255,255,255,0.15)");
  blg.addColorStop(1, "transparent");
  ctx.strokeStyle = blg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 590);
  ctx.lineTo(W - 150, 590);
  ctx.stroke();

  /* Date & Platform */
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "15px 'Segoe UI', sans-serif";
  ctx.fillText(`Awarded on ${date}`, W / 2, 630);

  /* Signature area */
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "italic 14px 'Georgia', serif";
  // Left signature
  ctx.fillText("_______________________", 280, 720);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText("Program Director", 280, 745);
  // Right signature
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "italic 14px 'Georgia', serif";
  ctx.fillText("_______________________", W - 280, 720);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText("LearnRights Platform", W - 280, 745);

  /* Bottom branding */
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText("LearnRights — Women's Legal Rights Education Platform", W / 2, H - 45);

  /* Watermark pattern */
  ctx.save();
  ctx.globalAlpha = 0.02;
  ctx.fillStyle = "#fff";
  ctx.font = "60px serif";
  for (let x = 0; x < W; x += 200) {
    for (let y = 0; y < H; y += 200) {
      ctx.fillText("⚖", x, y);
    }
  }
  ctx.restore();
}

const Achievements = () => {
  const { user, progress } = useUser();
  const [viewingCert, setViewingCert] = useState(null);
  const canvasRef = useRef(null);

  const earnedCerts = progress?.certificates || [];
  const completedModules = progress?.completedModules?.length || 0;
  const quizzesPassed = (progress?.quizzes || []).filter(q => q.score >= 48).length;
  const qualifiedModules = Math.min(completedModules, quizzesPassed);

  const handleViewCert = useCallback((cert) => {
    setViewingCert(cert);
    setTimeout(() => {
      if (canvasRef.current) {
        const dateStr = cert.earnedAt
          ? new Date(cert.earnedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
          : new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
        drawCertificate(canvasRef.current, user?.name || "Learner", cert.title, cert.type, dateStr, cert.modulesCompleted || cert.modulesRequired);
      }
    }, 100);
  }, [user]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !viewingCert) return;
    const link = document.createElement("a");
    link.download = `${viewingCert.title.replace(/\s+/g, "_")}_${user?.name || "certificate"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, [viewingCert, user]);

  return (
    <div className="ach-root">
      <div className="ach-container">
        {/* ── Header ── */}
        <div className="ach-header">
          <div className="ach-header-icon">
            <i className="bi bi-award-fill"></i>
          </div>
          <h1 className="ach-title">{t("achievements.title", { defaultValue: "Achievements & Certificates" })}</h1>
          <p className="ach-subtitle">{t("achievements.subtitle", { defaultValue: "Complete modules and pass quizzes to earn certificates" })}</p>
        </div>

        {/* ── Stats Bar ── */}
        <div className="ach-stats">
          <div className="ach-stat">
            <i className="bi bi-book-half"></i>
            <span className="ach-stat-val">{completedModules}/8</span>
            <span className="ach-stat-label">Modules Done</span>
          </div>
          <div className="ach-stat">
            <i className="bi bi-check-circle-fill"></i>
            <span className="ach-stat-val">{quizzesPassed}/8</span>
            <span className="ach-stat-label">Quizzes Passed</span>
          </div>
          <div className="ach-stat">
            <i className="bi bi-patch-check-fill"></i>
            <span className="ach-stat-val">{earnedCerts.length}/4</span>
            <span className="ach-stat-label">Certificates</span>
          </div>
          <div className="ach-stat">
            <i className="bi bi-star-fill"></i>
            <span className="ach-stat-val">{user?.points || 0}</span>
            <span className="ach-stat-label">Total Points</span>
          </div>
        </div>

        {/* ── Milestone Road ── */}
        <h2 className="ach-section-title">
          <i className="bi bi-signpost-2-fill"></i>
          Certificate Milestones
        </h2>
        <div className="ach-milestones">
          {MILESTONES.map((ms, idx) => {
            const earned = earnedCerts.find(c => c.type === ms.type);
            const progressPct = Math.min(100, (qualifiedModules / ms.modulesRequired) * 100);
            return (
              <div key={ms.type} className={`ach-milestone ${earned ? "ach-milestone-earned" : ""}`} style={{ "--accent": ms.color, animationDelay: `${idx * 0.1}s` }}>
                <div className="ach-ms-top">
                  <div className="ach-ms-icon" style={{ background: earned ? ms.gradient : "rgba(255,255,255,0.05)" }}>
                    <i className={`bi ${ms.icon}`}></i>
                  </div>
                  <div className="ach-ms-info">
                    <h3 className="ach-ms-title">{ms.title}</h3>
                    <p className="ach-ms-desc">Complete {ms.modulesRequired} modules with passing quizzes</p>
                  </div>
                  {earned && (
                    <span className="ach-ms-earned-badge">
                      <i className="bi bi-patch-check-fill"></i> Earned
                    </span>
                  )}
                </div>
                <div className="ach-ms-bar-wrap">
                  <div className="ach-ms-bar" style={{ width: `${progressPct}%`, background: ms.gradient }}></div>
                </div>
                <div className="ach-ms-bottom">
                  <span className="ach-ms-progress">{Math.min(qualifiedModules, ms.modulesRequired)}/{ms.modulesRequired} modules</span>
                  {earned ? (
                    <div className="ach-ms-actions">
                      <button className="ach-btn ach-btn-view" onClick={() => handleViewCert(earned)}>
                        <i className="bi bi-eye-fill"></i> View
                      </button>
                    </div>
                  ) : (
                    <span className="ach-ms-locked">
                      <i className="bi bi-lock-fill"></i> {ms.modulesRequired - qualifiedModules} more needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Badges ── */}
        <h2 className="ach-section-title">
          <i className="bi bi-trophy-fill"></i>
          Badges
        </h2>
        <div className="ach-badges">
          {(user?.badges?.length || 0) > 0 ? (
            user.badges.map((badge, i) => (
              <div key={i} className="ach-badge-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="ach-badge-icon">
                  <i className="bi bi-trophy-fill"></i>
                </div>
                <span className="ach-badge-name">{badge}</span>
              </div>
            ))
          ) : (
            <div className="ach-empty">
              <i className="bi bi-emoji-smile"></i>
              <p>Complete modules to earn your first badge!</p>
            </div>
          )}
        </div>

        {/* ── Certificate View Modal ── */}
        {viewingCert && (
          <div className="ach-modal-overlay" onClick={() => setViewingCert(null)}>
            <div className="ach-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ach-modal-header">
                <h3><i className="bi bi-award-fill"></i> {viewingCert.title}</h3>
                <button className="ach-modal-close" onClick={() => setViewingCert(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="ach-modal-body">
                <canvas ref={canvasRef} className="ach-cert-canvas"></canvas>
              </div>
              <div className="ach-modal-footer">
                <button className="ach-btn ach-btn-download" onClick={handleDownload}>
                  <i className="bi bi-download"></i> Download Certificate
                </button>
                <button className="ach-btn ach-btn-close" onClick={() => setViewingCert(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
