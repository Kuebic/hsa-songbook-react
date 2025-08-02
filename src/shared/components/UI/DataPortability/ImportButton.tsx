/**
 * @file ImportButton.tsx
 * @description Simple import button component using refactored hooks
 */

import React, { useCallback } from 'react';
import { Button } from '../Button';
import { useDataImport } from '../../../hooks/useDataImport';
import { useFileImport } from '../../../hooks/useFileImport';
import type { ExportData, ImportResult } from '../../../types/storage.types';
import type { ConflictResolution } from '../../../hooks/useDataImport';

export interface ImportButtonProps {
  userId: string;
  className?: string;
  children?: React.ReactNode;
  onComplete?: (result: ImportResult) => void;
  conflictResolution?: ConflictResolution;
}

export function ImportButton({ 
  userId, 
  className = '', 
  children = 'Import Data',
  onComplete,
  conflictResolution: defaultResolution = 'keep_existing'
}: ImportButtonProps) {
  const { loading, importData, setConflictResolution } = useDataImport(userId);
  
  const handleError = useCallback((error: string) => {
    alert(error);
  }, []);

  const { fileInputRef, triggerFileSelect, handleFileSelect } = useFileImport({
    accept: '.json',
    onError: handleError
  });

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const content = await handleFileSelect(event);
      if (!content) return;

      const data: ExportData = JSON.parse(content);
      
      // Set conflict resolution before import
      setConflictResolution(defaultResolution);
      
      const result = await importData(data);
      if (result) {
        onComplete?.(result);
      }
    } catch (err) {
      handleError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [handleFileSelect, importData, setConflictResolution, defaultResolution, onComplete, handleError]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <Button
        onClick={triggerFileSelect}
        disabled={loading}
        className={className}
      >
        {loading ? 'Importing...' : children}
      </Button>
    </>
  );
}