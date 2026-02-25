/**
 * Offline-aware network layer.
 * - Detects online/offline status
 * - Queues mutating requests (POST/PUT/DELETE) when offline
 * - Syncs the queue when back online
 * - Provides React hook for offline status
 */

import {
  enqueueOfflineAction,
  getOfflineQueue,
  removeFromQueue,
} from './offlineDB';
import axiosInstance from '../api/axios';

/* ── Online status ── */
let _listeners = [];

export function isOnline() {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter((cb) => cb !== callback);
  };
}

function _notifyListeners(online) {
  _listeners.forEach((cb) => {
    try { cb(online); } catch (e) { /* ignore */ }
  });
}

// Global event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    _notifyListeners(true);
    syncOfflineQueue();
  });
  window.addEventListener('offline', () => _notifyListeners(false));

  // Listen for service worker sync messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
        syncOfflineQueue();
      }
    });
  }
}

/* ── Queue a failed mutating request ── */
export async function queueOfflineRequest(method, url, data) {
  await enqueueOfflineAction({ method, url, data });
  console.log(`[Offline] Queued ${method} ${url}`);
}

/* ── Sync all queued requests ── */
let _syncing = false;

export async function syncOfflineQueue() {
  if (_syncing || !navigator.onLine) return;
  _syncing = true;

  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
      _syncing = false;
      return;
    }

    console.log(`[Offline Sync] Processing ${queue.length} queued actions...`);

    for (const action of queue) {
      try {
        await axiosInstance({
          method: action.method,
          url: action.url,
          data: action.data,
        });
        await removeFromQueue(action.id);
        console.log(`[Offline Sync] ✓ ${action.method} ${action.url}`);
      } catch (err) {
        console.error(`[Offline Sync] ✗ ${action.method} ${action.url}:`, err.message);
        // If it's a 4xx error, remove from queue (will never succeed)
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          await removeFromQueue(action.id);
        }
        // 5xx errors stay in queue for retry
      }
    }

    // Notify listeners to refresh data after sync
    _notifyListeners(true);
  } catch (err) {
    console.error('[Offline Sync] Error:', err);
  } finally {
    _syncing = false;
  }
}

/* ── Register Background Sync ── */
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('learnrights-sync');
    } catch (e) {
      // Background Sync not available; we'll sync on window online event
    }
  }
}
