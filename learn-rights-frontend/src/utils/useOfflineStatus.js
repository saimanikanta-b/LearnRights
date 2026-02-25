/**
 * React hook to track online/offline status.
 */
import { useState, useEffect } from 'react';
import { onOnlineStatusChange, isOnline } from './offlineSync';

export function useOfflineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const unsubscribe = onOnlineStatusChange((status) => {
      setOnline(status);
    });
    return unsubscribe;
  }, []);

  return online;
}
