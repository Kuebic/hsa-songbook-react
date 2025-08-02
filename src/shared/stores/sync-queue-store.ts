/**
 * @file sync-queue-store.ts
 * @description Zustand store for managing background sync queue operations
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { openDB, type IDBPDatabase } from 'idb';
import { errorReporting } from '../services/errorReporting';

// Type-safe data based on resource type
export type SyncOperationData = 
  | { resource: 'song'; data: Record<string, unknown> }
  | { resource: 'setlist'; data: Record<string, unknown> }
  | { resource: 'arrangement'; data: Record<string, unknown> };

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'song' | 'setlist' | 'arrangement';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface SyncQueueState {
  // Queue state
  operations: SyncOperation[];
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncErrors: Array<{ id: string; error: string; timestamp: number }>;
  
  // Stats
  totalPending: number;
  totalCompleted: number;
  totalFailed: number;
  
  // Actions
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void;
  removeOperation: (id: string) => void;
  updateOperationStatus: (id: string, status: SyncOperation['status'], error?: string) => void;
  incrementRetryCount: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  startSync: () => void;
  stopSync: () => void;
  
  // Getters
  getPendingOperations: () => SyncOperation[];
  getFailedOperations: () => SyncOperation[];
  getSyncStats: () => {
    pending: number;
    completed: number;
    failed: number;
    total: number;
  };
}

// IndexedDB for persistent queue storage
const DB_NAME = 'hsa-songbook-sync';
const DB_VERSION = 1;
const OPERATIONS_STORE = 'operations';

let db: IDBPDatabase | null = null;

const initDB = async (): Promise<IDBPDatabase> => {
  if (db) return db;
  
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        const store = db.createObjectStore(OPERATIONS_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('type', 'type');
        store.createIndex('resource', 'resource');
      }
    },
  });
  
  return db;
};

// Persist operations to IndexedDB
const persistOperation = async (operation: SyncOperation): Promise<void> => {
  const database = await initDB();
  await database.put(OPERATIONS_STORE, operation);
};

const removePersistedOperation = async (id: string): Promise<void> => {
  const database = await initDB();
  await database.delete(OPERATIONS_STORE, id);
};

const loadPersistedOperations = async (): Promise<SyncOperation[]> => {
  try {
    const database = await initDB();
    return await database.getAll(OPERATIONS_STORE);
  } catch (error) {
    console.warn('Failed to load persisted sync operations:', error);
    return [];
  }
};

// Generate unique ID for operations
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useSyncQueueStore = create<SyncQueueState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    operations: [],
    isSyncing: false,
    lastSyncTime: null,
    syncErrors: [],
    totalPending: 0,
    totalCompleted: 0,
    totalFailed: 0,
    
    // Actions
    addOperation: (operationData) => {
      const operation: SyncOperation = {
        ...operationData,
        id: generateId(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };
      
      set((state) => ({
        operations: [...state.operations, operation],
        totalPending: state.totalPending + 1,
      }));
      
      // Persist to IndexedDB
      persistOperation(operation).catch((error) => {
        // Use centralized error reporting instead of console.error
        errorReporting.reportSyncError(
          'Failed to persist sync operation',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'persist_operation',
            operationId: operation.id,
            operationType: operation.type,
            resource: operation.resource,
            store: 'sync-queue-store',
          }
        );
      });
    },
    
    removeOperation: (id) => {
      set((state) => {
        const operation = state.operations.find(op => op.id === id);
        if (!operation) return state;
        
        const newOperations = state.operations.filter(op => op.id !== id);
        const updates: Partial<SyncQueueState> = { operations: newOperations };
        
        // Update counters
        if (operation.status === 'pending') {
          updates.totalPending = state.totalPending - 1;
        } else if (operation.status === 'completed') {
          updates.totalCompleted = state.totalCompleted - 1;
        } else if (operation.status === 'failed') {
          updates.totalFailed = state.totalFailed - 1;
        }
        
        return { ...state, ...updates };
      });
      
      // Remove from IndexedDB
      removePersistedOperation(id).catch((error) => {
        // Use centralized error reporting instead of console.error
        errorReporting.reportSyncError(
          'Failed to remove persisted sync operation',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'remove_persisted_operation',
            operationId: id,
            store: 'sync-queue-store',
          }
        );
      });
    },
    
    updateOperationStatus: (id, status, error) => {
      set((state) => {
        const operationIndex = state.operations.findIndex(op => op.id === id);
        if (operationIndex === -1) return state;
        
        const operation = state.operations[operationIndex];
        const oldStatus = operation.status;
        
        const updatedOperation = {
          ...operation,
          status,
          lastError: error,
        };
        
        const newOperations = [...state.operations];
        newOperations[operationIndex] = updatedOperation;
        
        // Update counters
        let updates: Partial<SyncQueueState> = { operations: newOperations };
        
        if (oldStatus === 'pending' && status !== 'pending') {
          updates.totalPending = state.totalPending - 1;
        }
        if (status === 'completed' && oldStatus !== 'completed') {
          updates.totalCompleted = state.totalCompleted + 1;
        }
        if (status === 'failed' && oldStatus !== 'failed') {
          updates.totalFailed = state.totalFailed + 1;
        }
        
        // Add to sync errors if failed
        if (status === 'failed' && error) {
          updates.syncErrors = [
            ...state.syncErrors,
            { id, error, timestamp: Date.now() }
          ].slice(-10); // Keep only last 10 errors
        }
        
        return { ...state, ...updates };
      });
      
      // Update in IndexedDB
      const operation = get().operations.find(op => op.id === id);
      if (operation) {
        persistOperation(operation).catch((error) => {
          errorReporting.reportSyncError(
            'Failed to persist operation status update',
            error instanceof Error ? error : new Error(String(error)),
            {
              operation: 'persist_status_update',
              operationId: id,
              status,
              store: 'sync-queue-store',
            }
          );
        });
      }
    },
    
    incrementRetryCount: (id) => {
      set((state) => {
        const operationIndex = state.operations.findIndex(op => op.id === id);
        if (operationIndex === -1) return state;
        
        const operation = state.operations[operationIndex];
        const updatedOperation = {
          ...operation,
          retryCount: operation.retryCount + 1,
          status: 'pending' as const,
        };
        
        const newOperations = [...state.operations];
        newOperations[operationIndex] = updatedOperation;
        
        return { ...state, operations: newOperations };
      });
      
      // Update in IndexedDB
      const operation = get().operations.find(op => op.id === id);
      if (operation) {
        persistOperation(operation).catch((error) => {
          errorReporting.reportSyncError(
            'Failed to persist operation retry update',
            error instanceof Error ? error : new Error(String(error)),
            {
              operation: 'persist_retry_update',
              operationId: id,
              retryCount: operation.retryCount,
              store: 'sync-queue-store',
            }
          );
        });
      }
    },
    
    clearCompleted: () => {
      set((state) => {
        const completedIds = state.operations
          .filter(op => op.status === 'completed')
          .map(op => op.id);
        
        // Remove from IndexedDB
        completedIds.forEach(id => {
          removePersistedOperation(id).catch((error) => {
            errorReporting.reportSyncError(
              'Failed to remove completed operation',
              error instanceof Error ? error : new Error(String(error)),
              {
                operation: 'remove_completed_operation',
                operationId: id,
                store: 'sync-queue-store',
              }
            );
          });
        });
        
        return {
          ...state,
          operations: state.operations.filter(op => op.status !== 'completed'),
          totalCompleted: 0,
        };
      });
    },
    
    clearAll: () => {
      const operations = get().operations;
      
      // Clear IndexedDB
      operations.forEach(op => {
        removePersistedOperation(op.id).catch((error) => {
          errorReporting.reportSyncError(
            'Failed to remove operation during clear all',
            error instanceof Error ? error : new Error(String(error)),
            {
              operation: 'clear_all_operations',
              operationId: op.id,
              store: 'sync-queue-store',
            }
          );
        });
      });
      
      set({
        operations: [],
        syncErrors: [],
        totalPending: 0,
        totalCompleted: 0,
        totalFailed: 0,
      });
    },
    
    startSync: () => {
      set({ isSyncing: true });
    },
    
    stopSync: () => {
      set({ 
        isSyncing: false,
        lastSyncTime: Date.now(),
      });
    },
    
    // Getters
    getPendingOperations: () => {
      return get().operations.filter(op => op.status === 'pending');
    },
    
    getFailedOperations: () => {
      return get().operations.filter(op => op.status === 'failed');
    },
    
    getSyncStats: () => {
      const { totalPending, totalCompleted, totalFailed } = get();
      return {
        pending: totalPending,
        completed: totalCompleted,
        failed: totalFailed,
        total: totalPending + totalCompleted + totalFailed,
      };
    },
  }))
);

// Initialize store with persisted operations
if (typeof window !== 'undefined') {
  loadPersistedOperations().then((operations) => {
    if (operations.length > 0) {
      const pending = operations.filter(op => op.status === 'pending').length;
      const completed = operations.filter(op => op.status === 'completed').length;
      const failed = operations.filter(op => op.status === 'failed').length;
      
      useSyncQueueStore.setState({
        operations,
        totalPending: pending,
        totalCompleted: completed,
        totalFailed: failed,
      });
    }
  }).catch((error) => {
    errorReporting.reportSyncError(
      'Failed to initialize sync queue database',
      error instanceof Error ? error : new Error(String(error)),
      {
        operation: 'initialize_db',
        store: 'sync-queue-store',
      }
    );
  });
}