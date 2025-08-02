/**
 * @file useDataImport.ts
 * @description Custom hook for data import functionality
 */

import { useState, useCallback } from 'react';
import { useOfflineStorage } from './useOfflineStorage';
import type { ExportData, ImportResult } from '../types/storage.types';

export type ConflictResolution = 'keep_existing' | 'overwrite' | 'create_new';

export interface UseDataImportResult {
  loading: boolean;
  error: string | null;
  importResult: ImportResult | null;
  conflictResolution: ConflictResolution;
  setConflictResolution: (resolution: ConflictResolution) => void;
  importData: (data: ExportData) => Promise<ImportResult | null>;
  clearImportResult: () => void;
}

export function useDataImport(userId: string): UseDataImportResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('keep_existing');
  
  const storage = useOfflineStorage();

  const importData = useCallback(async (
    data: ExportData
  ): Promise<ImportResult | null> => {
    if (!storage.isReady || !userId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate the import data structure
      if (!data.version || !data.exportedBy) {
        throw new Error('Invalid export file format');
      }
      
      // Check if data is from a different user
      if (data.exportedBy !== userId) {
        console.warn('Importing data from a different user:', data.exportedBy);
      }
      
      const options = { 
        resolveConflicts: conflictResolution 
      };
      
      const result = await storage.importData(data, options);
      
      if (result.success) {
        setImportResult(result.data || null);
        return result.data || null;
      } else {
        const errorMessage = result.error || 'Import failed';
        setError(errorMessage);
        setImportResult({
          success: false,
          message: errorMessage,
          songsImported: 0,
          setlistsImported: 0,
          preferencesImported: 0,
          errors: [],
          conflicts: []
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Import failed:', err);
      
      // Create error result
      const errorResult: ImportResult = {
        success: false,
        message: errorMessage,
        songsImported: 0,
        setlistsImported: 0,
        preferencesImported: 0,
        errors: [{
          type: 'song',
          id: 'unknown',
          error: errorMessage
        }],
        conflicts: []
      };
      
      setImportResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [storage, userId, conflictResolution]);

  const clearImportResult = useCallback(() => {
    setImportResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    importResult,
    conflictResolution,
    setConflictResolution,
    importData,
    clearImportResult
  };
}