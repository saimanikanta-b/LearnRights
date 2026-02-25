import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { jwtDecode } from 'jwt-decode';
import { getLanguage, onTranslationChange } from '../utils/translation';
import {
  saveUserProfile, getUserProfile,
  saveUserProgress, getUserProgress,
  saveModules as saveModulesOffline, getModules as getModulesOffline,
  saveUserId,
  clearAllOfflineData,
} from '../utils/offlineDB';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});
  const [progress, setProgress] = useState({});
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize userId from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.userId);
      } catch (err) {
        console.error('Invalid token');
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Login: store new token and update userId immediately
  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.userId);
    } catch (err) {
      console.error('Invalid token on login');
    }
  };

  // Logout: clear token and reset all user state
  const logoutUser = () => {
    localStorage.removeItem('token');
    setUserId(null);
    setUser({});
    setProgress({});
    setModules([]);
    clearAllOfflineData();
  };

  // Fetch user data when userId is available
  useEffect(() => {
    if (!userId) return;

    // Save userId to IndexedDB for offline recovery
    saveUserId(userId).catch(() => {});

    const fetchUserData = async (isLangChange = false) => {
      try {
        // Only show loading spinner on initial load, not language changes
        if (!isLangChange) setLoading(true);
        const lang = getLanguage();
        const langParam = lang && lang !== 'en' ? `?lang=${lang}` : '';
        const [userRes, progressRes, modulesRes] = await Promise.all([
          axios.get(`/profile/${userId}`),
          axios.get(`/progress/${userId}`),
          axios.get(`/modules/user/${userId}${langParam}`)
        ]);

        setUser(userRes.data);
        setProgress(progressRes.data);
        // Only update modules if we got valid data back
        if (modulesRes.data && modulesRes.data.length > 0) {
          setModules(modulesRes.data);
        }

        // Cache data in IndexedDB for offline access
        saveUserProfile(userRes.data).catch(() => {});
        saveUserProgress(progressRes.data).catch(() => {});
        if (modulesRes.data && modulesRes.data.length > 0) {
          saveModulesOffline(modulesRes.data).catch(() => {});
        }
      } catch (error) {
        console.error('Error fetching user data:', error);

        // OFFLINE FALLBACK: load from IndexedDB
        if (!navigator.onLine) {
          try {
            const [cachedUser, cachedProgress, cachedModules] = await Promise.all([
              getUserProfile(),
              getUserProgress(),
              getModulesOffline(),
            ]);
            if (cachedUser) setUser(cachedUser);
            if (cachedProgress) setProgress(cachedProgress);
            if (cachedModules && cachedModules.length > 0) setModules(cachedModules);
            console.log('[Offline] Loaded cached user data from IndexedDB');
          } catch (dbErr) {
            console.error('Failed to load offline data:', dbErr);
          }
        }

        // On language change failure, try fetching without translation
        if (isLangChange) {
          try {
            const modulesRes = await axios.get(`/modules/user/${userId}`);
            if (modulesRes.data && modulesRes.data.length > 0) {
              setModules(modulesRes.data);
            }
          } catch (e) {
            console.error('Fallback fetch also failed:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData(false);

    // Re-fetch modules when language changes (silently, no loading spinner)
    const unsubscribe = onTranslationChange(() => {
      fetchUserData(true);
    });
    return () => unsubscribe();
  }, [userId]);

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!userId) return;

    try {
      const lang = getLanguage();
      const langParam = lang && lang !== 'en' ? `?lang=${lang}` : '';
      const [userRes, progressRes, modulesRes] = await Promise.all([
        axios.get(`/profile/${userId}`),
        axios.get(`/progress/${userId}`),
        axios.get(`/modules/user/${userId}${langParam}`)
      ]);

      setUser(userRes.data);
      setProgress(progressRes.data);
      if (modulesRes.data && modulesRes.data.length > 0) {
        setModules(modulesRes.data);
      }

      // Update offline cache
      saveUserProfile(userRes.data).catch(() => {});
      saveUserProgress(progressRes.data).catch(() => {});
      if (modulesRes.data && modulesRes.data.length > 0) {
        saveModulesOffline(modulesRes.data).catch(() => {});
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Make refreshUserData available globally for components that need it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshUserData = refreshUserData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Function to update progress locally (for immediate UI feedback)
  const updateProgressLocally = (newProgress) => {
    setProgress(prevProgress => ({
      ...prevProgress,
      ...newProgress
    }));
  };

  const value = {
    userId,
    user,
    progress,
    modules,
    loading,
    login,
    logoutUser,
    refreshUserData,
    updateProgressLocally
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
