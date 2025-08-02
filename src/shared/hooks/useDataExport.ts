/**
 * @file useDataExport.ts
 * @description Custom hook for data export functionality
 */

import { useState, useCallback } from 'react';
import { useOfflineStorage } from './useOfflineStorage';
import type { ExportData } from '../types/storage.types';

export interface UseDataExportResult {
  loading: boolean;
  error: string | null;
  exportData: () => Promise<ExportData | null>;
  downloadExport: () => Promise<boolean>;
}

export function useDataExport(userId: string): UseDataExportResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storage = useOfflineStorage();

  const exportData = useCallback(async (): Promise<ExportData | null> => {
    if (!storage.isReady || !userId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.exportData(userId);
      
      if (result.success) {
        return result.data || null;
      } else {
        setError(result.error || 'Export failed');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Export failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [storage, userId]);

  const downloadExport = useCallback(async (): Promise<boolean> => {
    try {
      const data = await exportData();
      if (!data) return false;

      // Create blob from export data
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date(data.exportedAt).toISOString().split('T')[0];
      
      link.href = url;
      link.download = `hsa-songbook-export-${timestamp}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      console.error('Download failed:', err);
      return false;
    }
  }, [exportData]);

  return {
    loading,
    error,
    exportData,
    downloadExport
  };
}