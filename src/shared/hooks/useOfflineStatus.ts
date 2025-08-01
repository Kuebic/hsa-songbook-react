/**
 * @file useOfflineStatus.ts
 * @description Hook for monitoring network status and offline capabilities
 */

import { useEffect, useState } from 'react';
import { useOfflineStore } from '../stores/offline-store';

export interface OfflineStatus {
  isOnline: boolean;
  isAppOnline: boolean;
  effectiveStatus: 'online' | 'offline' | 'limited';
  message: string;
  connectionType: string | null;
  lastOnlineTime: Date | null;
  hasOfflineData: boolean;
  cachedSongsCount: number;
  cachedSetlistsCount: number;
}

export const useOfflineStatus = (): OfflineStatus => {
  const {
    isOnline,
    isAppOnline,
    connectionType,
    lastOnlineTime,
    hasOfflineData,
    cachedSongsCount,
    cachedSetlistsCount,
    getNetworkStatus,
  } = useOfflineStore();

  const networkStatus = getNetworkStatus();

  return {
    isOnline,
    isAppOnline,
    effectiveStatus: networkStatus.effectiveStatus,
    message: networkStatus.message,
    connectionType,
    lastOnlineTime,
    hasOfflineData,
    cachedSongsCount,
    cachedSetlistsCount,
  };
};

export const useNetworkMonitor = () => {
  const { setOnlineStatus, setAppOnlineStatus } = useOfflineStore();
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMonitoring(true);

    // Initial status
    setOnlineStatus(navigator.onLine);

    // Network event listeners
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check
    const checkConnectivity = async () => {
      try {
        // Try to fetch a small resource to verify actual connectivity
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setAppOnlineStatus(response.ok);
      } catch {
        setAppOnlineStatus(false);
      }
    };

    // Check connectivity every 30 seconds when online
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        checkConnectivity();
      }
    }, 30000);

    // Initial connectivity check
    if (navigator.onLine) {
      checkConnectivity();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [setOnlineStatus, setAppOnlineStatus]);

  return { isMonitoring };
};