import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { t, getLanguage, loadTranslations, onTranslationChange, isTranslationLoading, LANGUAGES } from '../utils/translation';
import { useUser } from '../contexts/UserContext';
import 'bootstrap-icons/font/bootstrap-icons.css';

const navItems = [
  { path: "/home", icon: "bi-house-door-fill", labelKey: "home", short: "H" },
  { path: "/dashboard", icon: "bi-grid-1x2-fill", labelKey: "dashboard", short: "D" },
  { path: "/modules", icon: "bi-book-half", labelKey: "modules", short: "L" },
  { path: "/quiz", icon: "bi-pencil-square", labelKey: "quiz", short: "Q" },
  { path: "/achievements", icon: "bi-award-fill", labelKey: "achievements", short: "A" },
  { path: "/leaderboard", icon: "bi-trophy-fill", labelKey: "leaderboard", short: "R" },
  { path: "/chatbot", icon: "bi-chat-dots-fill", labelKey: "chatbot", short: "B" },
  { path: "/profile", icon: "bi-person-circle", labelKey: "profile", short: "M" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutUser } = useUser();
  const token = localStorage.getItem("token");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getLanguage());
  const [translating, setTranslating] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const unsub = onTranslationChange((lang) => {
      setCurrentLang(lang);
      setTranslating(isTranslationLoading());
    });
    return unsub;
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLanguageChange = async (langCode) => {
    if (langCode === currentLang) return;
    setLangOpen(false);
    setTranslating(true);
    const success = await loadTranslations(langCode);
    setTranslating(false);
    if (success) window.location.reload();
    else alert('Translation failed. Please make sure the backend server is running.');
  };

  const logout = () => {
    logoutUser();
    navigate("/login");
    setMobileOpen(false);
  };

  const currentLangName = LANGUAGES.find(l => l.code === currentLang)?.name || 'English';

  const styles = {
    navbar: {
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'linear-gradient(135deg, #0f0c29 0%, #1a1744 50%, #24243e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
      padding: '0 1rem',
    },
    inner: {
      maxWidth: 1200, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 60,
    },
    brand: {
      display: 'flex', alignItems: 'center', gap: 8,
      textDecoration: 'none', color: '#fff', fontWeight: 800, fontSize: '1.15rem',
    },
    brandIcon: {
      width: 40, height: 40, borderRadius: '0.75rem',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.2rem', color: '#fff',
      boxShadow: '0 2px 16px rgba(124,58,237,0.5)',
      transition: 'all 0.25s',
    },
    navLinks: {
      display: 'flex', alignItems: 'center', gap: 12,
    },
    navLink: (active) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '8px 14px', borderRadius: '0.85rem', gap: 3,
      color: active ? '#fff' : 'rgba(255,255,255,0.45)',
      background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
      border: active ? '1px solid rgba(167,139,250,0.25)' : '1px solid transparent',
      textDecoration: 'none',
      transition: 'all 0.2s', cursor: 'pointer',
      position: 'relative', minWidth: 0,
    }),
    actions: {
      display: 'flex', alignItems: 'center', gap: 10,
    },
    // Language button — frosted glass pill
    langBtn: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: '2rem',
      background: 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.25s', position: 'relative',
    },
    langDropdown: {
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      background: 'linear-gradient(180deg, #1e1b4b, #1a1744)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '0.85rem', padding: '6px 0',
      minWidth: 180, maxHeight: 280, overflowY: 'auto',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      zIndex: 999,
    },
    langItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      color: active ? '#a78bfa' : 'rgba(255,255,255,0.65)',
      background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
      fontSize: '0.82rem', fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.15s',
      borderLeft: active ? '3px solid #7c3aed' : '3px solid transparent',
    }),
    // Logout — glowing red compact button
    logoutBtn: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 16px', borderRadius: '2rem',
      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      color: '#fff', border: 'none', cursor: 'pointer',
      fontSize: '0.8rem', fontWeight: 600,
      boxShadow: '0 0 16px rgba(239,68,68,0.25), 0 2px 8px rgba(0,0,0,0.3)',
      transition: 'all 0.25s',
    },
    loginBtn: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 16px', borderRadius: '2rem',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color: '#fff', textDecoration: 'none',
      fontSize: '0.8rem', fontWeight: 600,
      boxShadow: '0 0 16px rgba(124,58,237,0.25), 0 2px 8px rgba(0,0,0,0.3)',
      transition: 'all 0.25s',
    },
    hamburger: {
      display: 'none', background: 'transparent', border: 'none',
      color: '#fff', fontSize: '1.4rem', cursor: 'pointer', padding: 4,
    },
    mobileMenu: {
      position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(180deg, #0f0c29, #1a1744 50%, #24243e)',
      zIndex: 999, padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: 6,
      overflowY: 'auto',
      animation: 'navSlideIn 0.25s ease',
    },
    mobileLink: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: '0.75rem',
      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
      background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
      border: active ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(255,255,255,0.05)',
      textDecoration: 'none', fontSize: '0.95rem', fontWeight: active ? 600 : 500,
      transition: 'all 0.2s',
    }),
  };

  return (
    <>
      <style>{`
        @keyframes navSlideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 991px) { .nav-desktop-links { display: none !important; } .nav-hamburger { display: flex !important; } }
        @media (max-width: 600px) { .nav-brand-text { display: none !important; } }
        @media (min-width: 992px) { .nav-mobile-overlay { display: none !important; } }
        .nav-lang-item:hover { background: rgba(124,58,237,0.1) !important; color: #c4b5fd !important; }
        .nav-link-hover:hover { background: rgba(124,58,237,0.1) !important; color: #fff !important; transform: translateY(-2px); }
        .nav-link-hover { position: relative; }
        .nav-link-hover::after {
          content: attr(data-tooltip);
          position: absolute; bottom: -32px; left: 50%; transform: translateX(-50%) scale(0.9);
          background: rgba(15,12,41,0.95); color: #c4b5fd; font-size: 0.68rem; font-weight: 600;
          padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none;
          opacity: 0; transition: all 0.2s ease; border: 1px solid rgba(124,58,237,0.2);
          z-index: 1001;
        }
        .nav-link-hover:hover::after { opacity: 1; transform: translateX(-50%) scale(1); }
        .nav-logout-hover:hover { box-shadow: 0 0 24px rgba(239,68,68,0.45), 0 4px 12px rgba(0,0,0,0.4) !important; transform: translateY(-1px); }
        .nav-login-hover:hover { box-shadow: 0 0 24px rgba(124,58,237,0.45), 0 4px 12px rgba(0,0,0,0.4) !important; transform: translateY(-1px); }
        .nav-lang-btn:hover { background: rgba(255,255,255,0.12) !important; border-color: rgba(167,139,250,0.35) !important; color: #c4b5fd !important; }
        .nav-lang-dropdown::-webkit-scrollbar { width: 4px; }
        .nav-lang-dropdown::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 4px; }
      `}</style>

      <nav style={styles.navbar}>
        <div style={styles.inner}>
          {/* Brand */}
          <Link to="/home" style={styles.brand} onClick={() => setMobileOpen(false)} title={t('app_name')}>
            <div style={styles.brandIcon}><i className="bi bi-shield-check"></i></div>
            <span className="nav-brand-text" style={{ whiteSpace: 'nowrap' }}>{t('app_name')}</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-desktop-links" style={styles.navLinks}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="nav-link-hover"
                  style={styles.navLink(active)} onClick={() => setMobileOpen(false)}
                  title={t(item.labelKey)}>
                  <i className={`bi ${item.icon}`} style={{ fontSize: '1.4rem' }}></i>
                  <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500, letterSpacing: '0.03em', lineHeight: 1, opacity: active ? 1 : 0.7, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>

          {/* Actions: Language + Logout */}
          <div style={styles.actions}>
            {/* Language Picker */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button className="nav-lang-btn" style={styles.langBtn}
                onClick={() => setLangOpen(!langOpen)} disabled={translating}>
                {translating ? (
                  <>
                    <div style={{
                      width: 14, height: 14, border: '2px solid rgba(167,139,250,0.3)',
                      borderTopColor: '#a78bfa', borderRadius: '50%',
                      animation: 'navSpin 0.6s linear infinite',
                    }} />
                    <span>...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-translate" style={{ fontSize: '0.9rem' }}></i>
                    <span>{currentLangName.split(' ')[0]}</span>
                    <i className="bi bi-chevron-down" style={{ fontSize: '0.6rem', opacity: 0.6 }}></i>
                  </>
                )}
              </button>
              {langOpen && (
                <div className="nav-lang-dropdown" style={styles.langDropdown}>
                  {LANGUAGES.map((lang) => (
                    <div key={lang.code} className="nav-lang-item"
                      style={styles.langItem(currentLang === lang.code)}
                      onClick={() => handleLanguageChange(lang.code)}>
                      {currentLang === lang.code && <i className="bi bi-check2" style={{ fontSize: '0.85rem' }}></i>}
                      {lang.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout / Login */}
            {token ? (
              <button className="nav-logout-hover" style={styles.logoutBtn} onClick={logout} title={t("logout")}>
                <i className="bi bi-power" style={{ fontSize: '0.9rem' }}></i>
                <span className="d-none d-md-inline">{t("logout")}</span>
              </button>
            ) : (
              <Link className="nav-login-hover" to="/login" style={styles.loginBtn}>
                <i className="bi bi-box-arrow-in-right" style={{ fontSize: '0.9rem' }}></i>
                <span>{t("login")}</span>
              </Link>
            )}

            {/* Hamburger */}
            <button className="nav-hamburger" style={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)}>
              <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="nav-mobile-overlay" style={styles.mobileMenu}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={styles.mobileLink(active)}
                onClick={() => setMobileOpen(false)}>
                <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem' }}></i>
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`@keyframes navSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default Navbar;
