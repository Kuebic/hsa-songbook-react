/**
 * @file useSyncQueue.ts
 * @description Hook for managing sync queue operations and background sync
 */

import { useCallback, useEffect } from 'react';
import { useSyncQueueStore } from '../stores/sync-queue-store';
import { useOfflineStatus } from './useOfflineStatus';
import { useBackgroundSync } from './useServiceWorker';

export const useSyncQueue = () => {
  const {
    operations,
    isSyncing,
    addOperation,
    removeOperation,
    updateOperationStatus,
    incrementRetryCount,
    clearCompleted,
    clearAll,
    startSync,
    stopSync,
    getPendingOperations,
    getFailedOperations,
    getSyncStats,
  } = useSyncQueueStore();

  const { isOnline } = useOfflineStatus();
  const { scheduleSync } = useBackgroundSync();

  /**
   * Add a new sync operation
   */
  const queueOperation = useCallback((
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: 'song' | 'setlist' | 'arrangement',
    data: any,
    maxRetries: number = 3
  ) => {
    addOperation({
      type,
      resource,
      data,
      maxRetries,
    });

    // Schedule background sync if online
    if (isOnline) {
      scheduleSync(`${resource}-sync`).catch(console.error);
    }
  }, [addOperation, isOnline, scheduleSync]);

  /**
   * Process pending operations
   */
  const processPendingOperations = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    const pendingOps = getPendingOperations();
    if (pendingOps.length === 0) return;

    startSync();

    try {
      for (const operation of pendingOps) {
        updateOperationStatus(operation.id, 'syncing');

        try {
          // Simulate API call - replace with actual API calls
          await processOperation(operation);
          updateOperationStatus(operation.id, 'completed');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (operation.retryCount < operation.maxRetries) {
            incrementRetryCount(operation.id);
            updateOperationStatus(operation.id, 'pending');
          } else {
            updateOperationStatus(operation.id, 'failed', errorMessage);
          }
        }
      }
    } finally {
      stopSync();
    }
  }, [
    isSyncing,
    isOnline,
    getPendingOperations,
    startSync,
    stopSync,
    updateOperationStatus,
    incrementRetryCount,
  ]);

  /**
   * Process a single operation (mock implementation)
   */
  const processOperation = async (operation: any): Promise<void> => {
    // This would be replaced with actual API calls
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Network error occurred');
    }

    console.log(`Processed ${operation.type} ${operation.resource}:`, operation.data);
  };

  /**
   * Retry failed operations
   */
  const retryFailedOperations = useCallback(() => {
    const failedOps = getFailedOperations();
    failedOps.forEach(op => {
      if (op.retryCount < op.maxRetries) {
        incrementRetryCount(op.id);
        updateOperationStatus(op.id, 'pending');
      }
    });
  }, [getFailedOperations, incrementRetryCount, updateOperationStatus]);

  /**
   * Auto-process pending operations when coming online
   */
  useEffect(() => {
    if (isOnline && !isSyncing) {
      const timeoutId = setTimeout(() => {
        processPendingOperations();
      }, 1000); // Wait 1 second after coming online

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, isSyncing, processPendingOperations]);

  return {
    // State
    operations,
    isSyncing,
    stats: getSyncStats(),
    pendingOperations: getPendingOperations(),
    failedOperations: getFailedOperations(),

    // Actions
    queueOperation,
    processPendingOperations,
    retryFailedOperations,
    removeOperation,
    clearCompleted,
    clearAll,

    // Utils
    canSync: isOnline && !isSyncing,
  };
};

/**
 * Hook for queueing specific operations
 */
export const useOperationQueue = () => {
  const { queueOperation } = useSyncQueue();

  const queueSongCreate = useCallback((songData: any) => {
    queueOperation('CREATE', 'song', songData);
  }, [queueOperation]);

  const queueSongUpdate = useCallback((songId: string, songData: any) => {
    queueOperation('UPDATE', 'song', { id: songId, ...songData });
  }, [queueOperation]);

  const queueSongDelete = useCallback((songId: string) => {
    queueOperation('DELETE', 'song', { id: songId });
  }, [queueOperation]);

  const queueSetlistCreate = useCallback((setlistData: any) => {
    queueOperation('CREATE', 'setlist', setlistData);
  }, [queueOperation]);

  const queueSetlistUpdate = useCallback((setlistId: string, setlistData: any) => {
    queueOperation('UPDATE', 'setlist', { id: setlistId, ...setlistData });
  }, [queueOperation]);

  const queueSetlistDelete = useCallback((setlistId: string) => {
    queueOperation('DELETE', 'setlist', { id: setlistId });
  }, [queueOperation]);

  return {
    queueSongCreate,
    queueSongUpdate,
    queueSongDelete,
    queueSetlistCreate,
    queueSetlistUpdate,
    queueSetlistDelete,
  };
};