import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '../utils/useOfflineStatus';

const OfflineBanner = () => {
  const online = useOfflineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [online, wasOffline]);

  if (online && !showReconnected) return null;

  return (
    <div style={online ? styles.reconnected : styles.offline}>
      <div style={styles.inner}>
        <i className={`bi ${online ? 'bi-wifi' : 'bi-wifi-off'}`} style={styles.icon}></i>
        <span style={styles.text}>
          {online
            ? 'Back online — syncing your data...'
            : 'You are offline — app is working with cached data'}
        </span>
        {!online && (
          <span style={styles.badge}>OFFLINE</span>
        )}
      </div>
    </div>
  );
};

const styles = {
  offline: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    padding: '10px 16px',
    boxShadow: '0 -2px 20px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease-out',
  },
  reconnected: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    padding: '10px 16px',
    boxShadow: '0 -2px 20px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease-out',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    fontSize: '1.1rem',
    color: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: '0.88rem',
    fontWeight: 600,
  },
  badge: {
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    letterSpacing: '1px',
  },
};

export default OfflineBanner;
