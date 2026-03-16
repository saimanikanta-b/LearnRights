// Translation system with Google Translate backend for all Indian languages
// Usage: import { t, setLanguage, getLanguage, loadTranslations, LANGUAGES } from './utils/translation';

import axios from '../api/axios';

// ── All supported Indian languages ──────────────────────────────────
export const LANGUAGES = [
  { code: 'en',  name: 'English' },
  { code: 'hi',  name: 'हिन्दी (Hindi)' },
  { code: 'te',  name: 'తెలుగు (Telugu)' },
  { code: 'ta',  name: 'தமிழ் (Tamil)' },
  { code: 'kn',  name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml',  name: 'മലയാളം (Malayalam)' },
  { code: 'mr',  name: 'मराठी (Marathi)' },
  { code: 'bn',  name: 'বাংলা (Bengali)' },
  { code: 'gu',  name: 'ગુજરાતી (Gujarati)' },
  { code: 'pa',  name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or',  name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as',  name: 'অসমীয়া (Assamese)' },
  { code: 'ur',  name: 'اردو (Urdu)' },
  { code: 'sa',  name: 'संस्कृतम् (Sanskrit)' },
  { code: 'ne',  name: 'नेपाली (Nepali)' },
  { code: 'sd',  name: 'سنڌي (Sindhi)' },
  { code: 'mai', name: 'मैथिली (Maithili)' },
];

// ── English base strings (source of truth) ──────────────────────────
const englishStrings = {
    // App name (brand / logo)
    'app_name': 'LR',

    // Navigation & General
    home: 'Home',
    dashboard: 'Dash',
    modules: 'Modules',
    quiz: 'Quiz',
    achievements: 'Awards',
    leaderboard: 'LBoard',
    chatbot: 'Bot',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',

    // Common Headings & UI
    'hero.title': 'Welcome to LearnRights',
    'hero.subtitle': 'Empowering Rural Women with Legal Knowledge',
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.modules_completed': 'Modules Completed',
    'dashboard.total_points': 'Total Points',
    'dashboard.average_score': 'Average Quiz Score',
    'dashboard.your_rank': 'Your Rank',
    'dashboard.continue_journey': 'Continue your journey towards legal empowerment',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.continue_learning': 'Continue Learning',
    'dashboard.ask_assistant': 'Ask Legal Assistant',
    'dashboard.view_leaderboard': 'View Leaderboard',
    'dashboard.update_profile': 'Update Profile',
    'dashboard.recent_progress': 'Recent Progress',

    'dashboard.achievements': 'Achievements',
    'dashboard.no_achievements': 'Complete modules and quizzes to earn badges!',

    'modules.title': 'Learning Modules',
    'modules.subtitle': 'Explore your rights and protections',
    'modules.start': 'Start Module',

    // --- Added missing keys from pages ---

    'modules.loading': 'Loading modules...',
    'modules.search_placeholder': 'Search modules...',
    'modules.no_modules_found': 'No modules found',
    'modules.try_different_search': 'Try different search or filters.',
    'modules.topics': 'Topics',
    'modules.review': '🔄 Review',
    'modules.back': 'Back to Modules',
    'modules.view_subtopics': 'View Subtopics',
    'modules.take_quiz': 'Take Quiz',
    'modules.back_to_topics': 'Back to Topics',
    'modules.click_to_read': 'Click to read',
    'modules.completed': '✓',
    'modules.not_completed': '○',
    'modules.back_to_subtopics': 'Back to Subtopics',
    'modules.content_not_available': 'Content not available.',
    'modules.already_completed': 'You have completed this topic!',
    'modules.mark_completed': 'Mark as Completed',

    // Modules filter/status headings
    'modules.filters.all': 'All',
    'modules.filters.not_started': 'Not Started',
    'modules.filters.in_progress': 'In Progress',
    'modules.filters.completed': 'Completed',

    'chatbot.imageSent': '[Image]',
    'chatbot.error': "Sorry, I couldn't process your request. Please try again.",
    'chatbot.voiceNotSupported': 'Voice input not supported in this browser.',
    'chatbot.voiceError': 'Voice input failed. Please try again.',
    'chatbot.suggestion1': 'What are my basic rights?',
    'chatbot.suggestion2': 'How to file a complaint?',
    'chatbot.suggestion3': 'Legal aid services?',
    'chatbot.suggestion4': 'Domestic violence help?',
    'chatbot.title': 'Bot',
    'chatbot.subtitle': 'Legal rights assistant',
    'chatbot.clearChat': 'New chat',
    'chatbot.welcome': 'Ask me anything about your legal rights',
    'chatbot.tryAsking': 'Try asking:',
    'chatbot.attachImage': 'Attach image',
    'chatbot.placeholder': 'Ask me about your legal rights...',
    'chatbot.voice': 'Voice input',
    'chatbot.send': 'Send',
    'chatbot.listening': 'Listening...',
    'chatbot.speakClearly': 'Speak your question clearly',
    'chatbot.disclaimer': 'This AI provides general information only. For legal advice, consult a qualified attorney.',

    'users.fetchError': 'Failed to fetch users',
    'users.loading': 'Loading users...',
    'users.title': 'User Management',
    'users.subtitle': 'View and manage all platform users',
    'users.totalUsers': 'Total Users',
    'users.searchPlaceholder': 'Search users by name or email...',
    'users.sortBy': 'Sort by:',
    'users.name': 'Name',
    'users.email': 'Email',
    'users.noUsers': 'No users found',
    'users.noSearchResults': 'Try adjusting your search criteria',
    'users.noUsersText': 'No users have registered yet',
    'users.points': 'points',
    'users.joined': 'Joined',
    'users.footer': 'Showing {count} of {total} users',

    'auth.passwordMismatch': 'Passwords do not match',
    'auth.passwordTooShort': 'Password must be at least 6 characters',
    'auth.signupSuccess': 'Account created successfully!',
    'auth.signupFailed': 'Failed to create account',
    'auth.joinCommunity': 'Join our community of empowered learners',
    'auth.createAccount': 'Create Your Account',
    'auth.startJourney': 'Start your legal education journey today',
    'auth.fullName': 'Full Name',
    'auth.enterFullName': 'Enter your full name',
    'auth.email': 'Email Address',
    'auth.enterEmail': 'Enter your email address',
    'auth.preferredLanguage': 'Preferred Language',
    'auth.password': 'Password',
    'auth.createPassword': 'Create a strong password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.creatingAccount': 'Creating Account...',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signIn': 'Sign In',
    'auth.agreeToTerms': 'By signing up, you agree to our Terms of Service and Privacy Policy.',

    'profile.change_photo': 'Change photo',
    'profile.default_name': 'Learner',
    'profile.points': 'Points',
    'profile.modules': 'Modules',
    'profile.badges': 'Badges',
    'profile.tabs.personal': 'Personal Info',
    'profile.tabs.progress': 'Progress',
    'profile.tabs.achievements': 'Achievements',
    'profile.fields.name': 'Full Name',
    'profile.fields.email': 'Email',
    'profile.fields.mobile': 'Mobile',
    'profile.fields.language': 'Language',
    'profile.preferences': 'Preferences',
    'profile.show_on_leaderboard': 'Show my progress on leaderboard',
    'profile.email_notifications': 'Receive email updates',
    'profile.save': 'Save',
    'profile.saved': 'Saved.',
    'profile.progress.completed_modules': 'Completed Modules',
    'profile.progress.quizzes_taken': 'Quizzes Taken',
    'profile.progress.total_points': 'Total Points',
    'profile.progress.module_progress': 'Module Progress',
    'profile.progress.subtopics': 'subtopics',
    'profile.progress.no_modules': 'No modules available yet.',
    'profile.achievements.keep_learning': 'Complete modules and quizzes to earn your first badge!',

    'login.failed': 'Login failed. Please try again.',
    'login.sign_in_continue': 'Sign in to continue your learning journey',
    'login.email_placeholder': 'Enter your email',
    'login.password_placeholder': 'Enter your password',
    'login.remember_me': 'Remember me',
    'login.forgot_password': 'Forgot Password?',
    'login.signing_in': 'Signing In...',
    'login.or': 'or',
    'login.continue_google': 'Continue with Google',
    'login.footer': 'By signing in, you agree to our Terms of Service and Privacy Policy',

    'leaderboard.error_load': 'Failed to load leaderboard',
    'leaderboard.loading': 'Loading leaderboard...',
    'leaderboard.error_title': 'Something went wrong',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.subtitle': 'See how you rank among fellow learners!',
    'leaderboard.full_leaderboard_title': 'Complete Rankings',
    'leaderboard.no_data_message': 'Start learning to see your ranking here!',
    'leaderboard.rank': 'Rank',
    'leaderboard.player': 'Player',
    'leaderboard.level': 'Level',
    'leaderboard.points': 'Points',
    'leaderboard.modules_col': 'Modules',

    'home.features.modules.title': 'Learning Modules',
    'home.features.modules.description': 'Rights explained with real-life examples and interactive content.',
    'home.features.modules.action': 'Start Learning',
    'home.features.chatbot.title': 'AI Legal Assistant',
    'home.features.chatbot.description': 'Ask legal questions anytime in your preferred language.',
    'home.features.chatbot.action': 'Ask Questions',
    'home.features.leaderboard.title': 'Community Leaderboard',
    'home.features.leaderboard.description': 'Earn points, track progress, and compete with others.',
    'home.features.leaderboard.action': 'View Rankings',
    'home.stats.users': 'Active Learners',
    'home.stats.modules': 'Learning Modules',
    'home.stats.languages': 'Languages',
    'home.stats.support': 'AI Support',
    'home.hero.title': 'Learn Your Rights',
    'home.hero.subtitle': 'Empower Yourself',
    'home.hero.description': 'Learn about your legal rights, access resources, and connect with a supportive community.',
    'home.hero.start_learning': 'Start Learning',
    'home.hero.view_dashboard': 'View Dashboard',
    'home.hero.rights': 'Know Your Rights',
    'home.hero.empower': 'Get Empowered',
    'home.hero.grow': 'Grow Together',
    'home.features.title': 'Why Choose Learn Rights?',
    'home.features.subtitle': 'Discover the features that make learning legal rights accessible and engaging.',
    'home.cta.title': 'Ready to Start Your Learning Journey?',
    'home.cta.description': 'Join thousands of women who are learning and exercising their rights every day.',
    'home.cta.join_now': "Join Now - It's Free",
    'home.cta.sign_in': 'Sign In',

    'admin.title': 'Admin Dashboard',

    'quiz.title': 'Quiz',
    'quiz.subtitle': 'Test your knowledge and earn points!',
    'quiz.start_quiz': 'Start Quiz',
    'quiz.submit_quiz': 'Submit Quiz',
    'quiz.questions': 'Questions',
    'quiz.pass_mark': 'Pass',
    'quiz.total_marks': 'Marks',
    'quiz.no_quizzes_title': 'No Quizzes Available',
    'quiz.no_quizzes_message': 'Complete some modules to unlock quizzes!',


    'profile.title': 'Profile',
    'profile.edit': 'Edit Profile',

    'login.title': 'Login',
    'login.welcome_back': 'Welcome Back',
    'login.sign_in': 'Sign In',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.no_account': "Don't have an account?",
    'login.sign_up': 'Sign Up',

    'signup.title': 'Sign Up',
    'signup.create_account': 'Create Account',
    'signup.already_have_account': 'Already have an account?',
    'signup.sign_in': 'Sign In',

    // Add more keys as needed for your UI
};

// ── Runtime translated strings cache: { hi: { key: translatedText }, ... }
const translatedCache = {};

// ── Cache version — increment to invalidate stale localStorage entries ──
const CACHE_VERSION = 2;

// ── Auto-load cached translations from localStorage on startup ──────
// This makes language switching INSTANT after the first translation.
(function _initCache() {
  // Check cache version — clear stale data from previous implementations
  const storedVersion = parseInt(localStorage.getItem('translation_cache_version') || '0', 10);
  if (storedVersion < CACHE_VERSION) {
    // Clear all old translation caches
    LANGUAGES.forEach(l => localStorage.removeItem(`translations_${l.code}`));
    localStorage.setItem('translation_cache_version', String(CACHE_VERSION));
  }

  const lang = localStorage.getItem('language') || 'en';
  if (lang !== 'en') {
    const cacheKey = `translations_${lang}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      try {
        translatedCache[lang] = JSON.parse(stored);
      } catch (e) { /* ignore corrupted cache */ }
    }
  }
})();

// ── Loading state ────────────────────────────────────────────────────
let _isLoading = false;
let _listeners = [];

export function onTranslationChange(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function _notifyListeners() {
  _listeners.forEach(fn => fn(getLanguage()));
}

// ── Public API ───────────────────────────────────────────────────────

export function getLanguage() {
  return localStorage.getItem('language') || 'en';
}

export function setLanguage(lang) {
  localStorage.setItem('language', lang);
}

export function isTranslationLoading() {
  return _isLoading;
}

/**
 * Get translated text for a key. Falls back to English.
 */
export function t(key, options) {
  const lang = getLanguage();

  // If English, return from base strings
  if (lang === 'en') {
    return englishStrings[key] || (options && options.defaultValue) || key;
  }

  // Check translated cache
  if (translatedCache[lang] && translatedCache[lang][key]) {
    return translatedCache[lang][key];
  }

  // Fallback to English while translation loads
  return englishStrings[key] || (options && options.defaultValue) || key;
}

/**
 * Load translations for a target language from the backend.
 * Returns true on success, false on failure.
 * Caches results in localStorage + memory for instant subsequent loads.
 */
export async function loadTranslations(lang) {
  if (lang === 'en') {
    setLanguage('en');
    _notifyListeners();
    return true;
  }

  const cacheKey = `translations_${lang}`;

  // Always fetch fresh data from the backend GET endpoint (instant — just reads a JSON file).
  // This avoids stale/corrupt localStorage entries from previous failed attempts.
  _isLoading = true;
  _notifyListeners();

  try {
    const response = await axios.get(`/language/translate/${lang}`);
    const { translations } = response.data;

    if (translations && Object.keys(translations).length > 0) {
      translatedCache[lang] = translations;
      localStorage.setItem(cacheKey, JSON.stringify(translations));
      setLanguage(lang);
      _isLoading = false;
      _notifyListeners();
      return true;
    }

    // Cache was empty on server — try POST as fallback (live translation)
    const postResponse = await axios.post('/language/translate', {
      texts: englishStrings,
      target_language: lang,
    });
    const postTranslations = postResponse.data.translations;
    if (postTranslations && Object.keys(postTranslations).length > 0) {
      translatedCache[lang] = postTranslations;
      localStorage.setItem(cacheKey, JSON.stringify(postTranslations));
      setLanguage(lang);
      _isLoading = false;
      _notifyListeners();
      return true;
    }
  } catch (err) {
    console.error('Translation failed:', err);

    // If backend is down, fall back to localStorage cache
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Object.keys(parsed).length > 0) {
          translatedCache[lang] = parsed;
          setLanguage(lang);
          _isLoading = false;
          _notifyListeners();
          return true;
        }
      } catch (e) { /* ignore bad cache */ }
    }
  }

  _isLoading = false;
  _notifyListeners();
  return false;
}

/**
 * Clear cached translations (useful during development).
 */
export function clearTranslationCache() {
  LANGUAGES.forEach(l => {
    localStorage.removeItem(`translations_${l.code}`);
    delete translatedCache[l.code];
  });
}
