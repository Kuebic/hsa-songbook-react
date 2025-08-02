/**
 * @file useServiceWorker.ts
 * @description Hook for service worker registration and communication
 */

import { useEffect, useState, useCallback } from 'react';
import { Workbox } from 'workbox-window';
import { useOfflineStore } from '../stores/offline-store';
import { errorReporting } from '../services/errorReporting';

// Service Worker message types
interface ServiceWorkerMessage {
  type: string;
  [key: string]: unknown;
}

interface SyncMessage extends ServiceWorkerMessage {
  type: 'SCHEDULE_SYNC';
  tag: string;
  data?: Record<string, unknown>;
}

export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  error: string | null;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isRegistered: false,
    isUpdateAvailable: false,
    isUpdating: false,
    error: null,
    registration: null,
  });

  const [workbox, setWorkbox] = useState<Workbox | null>(null);
  const { setUpdateStatus, setLastUpdateCheck } = useOfflineStore();

  // Initialize service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setStatus(prev => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }

    // Development mode - don't register SW in dev unless explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_SW_DEV) {
      console.log('Service Worker disabled in development mode');
      return;
    }

    const wb = new Workbox('/sw.js');
    setWorkbox(wb);

    // Service worker events
    wb.addEventListener('installed', (event) => {
      console.log('Service Worker installed:', event);
      setStatus(prev => ({ ...prev, isRegistered: true }));
    });

    wb.addEventListener('waiting', (event) => {
      console.log('Service Worker waiting:', event);
      setStatus(prev => ({ ...prev, isUpdateAvailable: true }));
      setUpdateStatus(true);
    });

    wb.addEventListener('controlling', (event) => {
      console.log('Service Worker controlling:', event);
      setStatus(prev => ({ ...prev, isUpdating: false }));
      setUpdateStatus(false, false);
      // Reload the page to ensure all assets are updated
      window.location.reload();
    });

    wb.addEventListener('activated', (event) => {
      console.log('Service Worker activated:', event);
    });

    wb.addEventListener('redundant', (event) => {
      console.log('Service Worker redundant:', event);
    });

    // Register service worker
    wb.register()
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        setStatus(prev => ({ 
          ...prev, 
          isRegistered: true, 
          registration: registration || null 
        }));

        // Check for updates periodically
        const checkForUpdates = () => {
          if (registration) {
            registration.update();
            setLastUpdateCheck(new Date());
          }
        };

        // Check for updates every 60 seconds
        const updateInterval = setInterval(checkForUpdates, 60000);

        // Check for updates on focus
        const handleFocus = () => checkForUpdates();
        window.addEventListener('focus', handleFocus);

        // Cleanup
        return () => {
          clearInterval(updateInterval);
          window.removeEventListener('focus', handleFocus);
        };
      })
      .catch((error) => {
        // Use centralized error reporting instead of console.error
        errorReporting.reportServiceWorkerError(
          'Service Worker registration failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'registration',
            serviceWorkerUrl: '/sw.js',
          }
        );
        setStatus(prev => ({ ...prev, error: error.message }));
      });

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'CACHE_UPDATED':
            console.log('Cache updated:', event.data);
            // Notify user that new content is available
            setStatus(prev => ({ ...prev, isUpdateAvailable: true }));
            setUpdateStatus(true);
            break;
          
          case 'OFFLINE_READY':
            console.log('App ready for offline use');
            break;
          
          case 'BACKGROUND_SYNC':
            console.log('Background sync event:', event.data);
            // Handle background sync completion
            break;
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [setUpdateStatus, setLastUpdateCheck]);

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    if (!workbox) return;

    setStatus(prev => ({ ...prev, isUpdating: true }));
    setUpdateStatus(true, true);

    try {
      // Skip waiting and activate new service worker
      await workbox.messageSkipWaiting();
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportServiceWorkerError(
        'Failed to update service worker',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'update',
        }
      );
      setStatus(prev => ({ ...prev, error: (error as Error).message, isUpdating: false }));
      setUpdateStatus(false, false);
    }
  }, [workbox, setUpdateStatus]);

  // Send message to service worker
  const sendMessage = useCallback(async (message: ServiceWorkerMessage) => {
    if (!workbox) return;

    try {
      const response = await workbox.messageSW(message);
      return response;
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportServiceWorkerError(
        'Failed to send message to service worker',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'send_message',
          message: JSON.stringify(message),
        }
      );
      throw error;
    }
  }, [workbox]);

  // Get cache info
  const getCacheInfo = useCallback(async () => {
    try {
      const response = await sendMessage({ type: 'GET_CACHE_INFO' });
      return response;
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportServiceWorkerError(
        'Failed to get cache info',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'get_cache_info',
        }
      );
      return null;
    }
  }, [sendMessage]);

  // Clear cache
  const clearCache = useCallback(async (cacheNames?: string[]) => {
    try {
      const response = await sendMessage({ 
        type: 'CLEAR_CACHE', 
        cacheNames 
      });
      return response;
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportServiceWorkerError(
        'Failed to clear cache',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'clear_cache',
          cacheNames: cacheNames ? JSON.stringify(cacheNames) : 'all',
        }
      );
      throw error;
    }
  }, [sendMessage]);

  return {
    status,
    updateServiceWorker,
    sendMessage,
    getCacheInfo,
    clearCache,
  };
};

// Hook for background sync
export const useBackgroundSync = () => {
  const { sendMessage } = useServiceWorker();

  const scheduleSync = useCallback(async (tag: string, data?: Record<string, unknown>) => {
    try {
      await sendMessage({
        type: 'SCHEDULE_SYNC',
        tag,
        data,
      });
    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportServiceWorkerError(
        'Failed to schedule background sync',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'schedule_sync',
          tag,
          data: data ? JSON.stringify(data) : undefined,
        }
      );
      throw error;
    }
  }, [sendMessage]);

  return { scheduleSync };
};