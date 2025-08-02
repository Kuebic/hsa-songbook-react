/**
 * @file ImportSection.tsx
 * @description Import section component for DataPortability
 */

import React, { useCallback } from 'react';
import { Button } from '../Button';
import { useDataImport } from '../../../hooks/useDataImport';
import { useFileImport } from '../../../hooks/useFileImport';
import { ConflictResolutionOptions } from './ConflictResolutionOptions';
import { ImportResults } from './ImportResults';
import type { ExportData, ImportResult } from '../../../types/storage.types';

export interface ImportSectionProps {
  userId: string;
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

export function ImportSection({ 
  userId, 
  onImportComplete,
  className = '' 
}: ImportSectionProps) {
  const {
    loading,
    error,
    importResult,
    conflictResolution,
    setConflictResolution,
    importData,
    clearImportResult
  } = useDataImport(userId);

  const handleError = useCallback((errorMessage: string) => {
    alert(errorMessage);
  }, []);

  const { fileInputRef, triggerFileSelect, handleFileSelect } = useFileImport({
    accept: '.json',
    maxSize: 10 * 1024 * 1024, // 10MB
    onError: handleError
  });

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const content = await handleFileSelect(event);
      if (!content) return;

      const data: ExportData = JSON.parse(content);
      const result = await importData(data);
      
      if (result) {
        onImportComplete?.(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      handleError(`Import failed: ${errorMessage}`);
    }
  }, [handleFileSelect, importData, onImportComplete, handleError]);

  return (
    <div className={className}>
      <h4 className="text-lg font-medium mb-3 text-gray-800">Import Data</h4>
      <p className="text-sm text-gray-600 mb-4">
        Import setlists, songs, and preferences from a previously exported JSON file.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Conflict Resolution Options */}
      <ConflictResolutionOptions
        value={conflictResolution}
        onChange={setConflictResolution}
        disabled={loading}
        className="mb-4"
      />

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
        variant="success"
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
      >
        {loading ? 'Importing...' : 'Select Import File'}
      </Button>

      {/* Import Results */}
      {importResult && (
        <ImportResults
          result={importResult}
          onClear={clearImportResult}
        />
      )}
    </div>
  );
}