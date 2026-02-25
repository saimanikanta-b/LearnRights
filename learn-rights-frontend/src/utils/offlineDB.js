/**
 * IndexedDB wrapper for offline data storage.
 * Stores user profile, modules, progress, leaderboard, quiz data, and
 * a queue of actions performed while offline (to sync later).
 */

const DB_NAME = 'LearnRightsOffline';
const DB_VERSION = 1;

const STORES = {
  userData: 'userData',       // key: 'profile', 'progress', 'userId'
  modules: 'modules',         // key: module _id
  leaderboard: 'leaderboard', // key: 'data'
  quizCache: 'quizCache',     // key: moduleId
  offlineQueue: 'offlineQueue', // auto-increment, queued API calls
  appCache: 'appCache',       // generic key-value for misc data
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORES.userData)) {
        db.createObjectStore(STORES.userData, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.modules)) {
        db.createObjectStore(STORES.modules, { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains(STORES.leaderboard)) {
        db.createObjectStore(STORES.leaderboard, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.quizCache)) {
        db.createObjectStore(STORES.quizCache, { keyPath: 'moduleId' });
      }
      if (!db.objectStoreNames.contains(STORES.offlineQueue)) {
        db.createObjectStore(STORES.offlineQueue, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.appCache)) {
        db.createObjectStore(STORES.appCache, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

/* ── Generic helpers ── */

async function putItem(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getItem(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function getAllItems(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteItem(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ── User Data ── */

export async function saveUserProfile(profile) {
  return putItem(STORES.userData, { key: 'profile', data: profile, updatedAt: Date.now() });
}

export async function getUserProfile() {
  const item = await getItem(STORES.userData, 'profile');
  return item?.data || null;
}

export async function saveUserProgress(progress) {
  return putItem(STORES.userData, { key: 'progress', data: progress, updatedAt: Date.now() });
}

export async function getUserProgress() {
  const item = await getItem(STORES.userData, 'progress');
  return item?.data || null;
}

export async function saveUserId(userId) {
  return putItem(STORES.userData, { key: 'userId', data: userId });
}

export async function getUserId() {
  const item = await getItem(STORES.userData, 'userId');
  return item?.data || null;
}

/* ── Modules ── */

export async function saveModules(modules) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.modules, 'readwrite');
    const store = tx.objectStore(STORES.modules);
    store.clear();
    modules.forEach((mod) => store.put(mod));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getModules() {
  return getAllItems(STORES.modules);
}

/* ── Leaderboard ── */

export async function saveLeaderboard(data) {
  return putItem(STORES.leaderboard, { key: 'data', data, updatedAt: Date.now() });
}

export async function getLeaderboard() {
  const item = await getItem(STORES.leaderboard, 'data');
  return item?.data || null;
}

/* ── Quiz cache ── */

export async function saveQuizQuestions(moduleId, questions) {
  return putItem(STORES.quizCache, { moduleId, questions, updatedAt: Date.now() });
}

export async function getQuizQuestions(moduleId) {
  const item = await getItem(STORES.quizCache, moduleId);
  return item?.questions || null;
}

/* ── Offline action queue ── */

export async function enqueueOfflineAction(action) {
  // action = { method, url, data, timestamp }
  return putItem(STORES.offlineQueue, { ...action, id: Date.now() + Math.random(), timestamp: Date.now() });
}

export async function getOfflineQueue() {
  return getAllItems(STORES.offlineQueue);
}

export async function removeFromQueue(id) {
  return deleteItem(STORES.offlineQueue, id);
}

export async function clearOfflineQueue() {
  return clearStore(STORES.offlineQueue);
}

/* ── Generic app cache ── */

export async function cacheData(key, data) {
  return putItem(STORES.appCache, { key, data, updatedAt: Date.now() });
}

export async function getCachedData(key) {
  const item = await getItem(STORES.appCache, key);
  return item?.data || null;
}

/* ── Clear all offline data (on logout) ── */

export async function clearAllOfflineData() {
  try {
    await Promise.all(Object.values(STORES).map((s) => clearStore(s)));
  } catch (e) {
    console.warn('Failed to clear offline data:', e);
  }
}
