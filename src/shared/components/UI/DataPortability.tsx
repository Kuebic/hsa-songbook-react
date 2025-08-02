/**
 * @file DataPortability.tsx
 * @description Component for data export/import functionality
 */

import React, { useState, useRef, useCallback } from 'react';
import { useDataPortability } from '../../hooks/useOfflineStorage';
import type { ExportData, ImportResult } from '../../types/storage.types';
import { errorReporting } from '../../services/errorReporting';
import { Button } from './Button';
import { Card } from './Card';
import { showError, showWarning } from './StatusToast';

interface DataPortabilityProps {
  userId: string;
  className?: string;
  showImport?: boolean;
  showExport?: boolean;
  onImportComplete?: (result: ImportResult) => void;
  onExportComplete?: (data: ExportData) => void;
}

export function DataPortability({
  userId,
  className = '',
  showImport = true,
  showExport = true,
  onImportComplete,
  onExportComplete,
}: DataPortabilityProps) {
  const { loading, error, exportData, importData, downloadExport } = useDataPortability(userId);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'keep_existing' | 'overwrite' | 'create_new'>('keep_existing');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleExport = useCallback(async () => {
    try {
      const data = await exportData();
      if (data) {
        onExportComplete?.(data);
      }
    } catch (err) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportStorageError(
        'Data export failed',
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'DataPortability',
          operation: 'export',
          userId,
        }
      );
    }
  }, [exportData, onExportComplete]);

  const handleDownloadExport = useCallback(async () => {
    const success = await downloadExport();
    if (success) {
      const data = await exportData();
      if (data) {
        onExportComplete?.(data);
      }
    }
  }, [downloadExport, exportData, onExportComplete]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      showError('Invalid File Type', 'Please select a valid JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importDataObj: ExportData = JSON.parse(content);
        
        // Validate the import data structure
        if (!importDataObj.version || !importDataObj.exportedBy) {
          throw new Error('Invalid export file format');
        }

        const result = await importData(importDataObj, { 
          resolveConflicts: conflictResolution 
        });
        
        if (result) {
          setImportResult(result);
          onImportComplete?.(result);
        }
      } catch (err) {
        // Use centralized error reporting instead of console.error
        errorReporting.reportStorageError(
          'Data import failed',
          err instanceof Error ? err : new Error(String(err)),
          {
            component: 'DataPortability',
            operation: 'import',
            userId,
            conflictResolution,
          }
        );
        showError('Import Failed', err instanceof Error ? err.message : 'Unknown error');
      }
    };

    reader.onerror = () => {
      showError('File Read Error', 'Failed to read the selected file');
    };

    reader.readAsText(file);
  }, [importData, conflictResolution, onImportComplete]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImportResult = useCallback(() => {
    setImportResult(null);
  }, []);

  if (!showImport && !showExport) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📦</span>
        Data Management
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Export Section */}
        {showExport && (
          <div>
            <h4 className="text-lg font-medium mb-3 text-gray-800">Export Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Export all your setlists, songs, and preferences to a JSON file for backup or transfer.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDownloadExport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                {loading ? 'Exporting...' : 'Download Export File'}
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
              >
                {loading ? 'Preparing...' : 'Get Export Data'}
              </Button>
            </div>
          </div>
        )}

        {/* Import Section */}
        {showImport && (
          <div>
            <h4 className="text-lg font-medium mb-3 text-gray-800">Import Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Import setlists, songs, and preferences from a previously exported JSON file.
            </p>

            {/* Conflict Resolution Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How to handle conflicts with existing data:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="conflictResolution"
                    value="keep_existing"
                    checked={conflictResolution === 'keep_existing'}
                    onChange={(e) => setConflictResolution(e.target.value as 'keep_existing' | 'overwrite' | 'create_new')}
                    className="mr-2"
                  />
                  <span className="text-sm">Keep existing data (recommended)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="conflictResolution"
                    value="overwrite"
                    checked={conflictResolution === 'overwrite'}
                    onChange={(e) => setConflictResolution(e.target.value as 'keep_existing' | 'overwrite' | 'create_new')}
                    className="mr-2"
                  />
                  <span className="text-sm">Overwrite with imported data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="conflictResolution"
                    value="create_new"
                    checked={conflictResolution === 'create_new'}
                    onChange={(e) => setConflictResolution(e.target.value as 'keep_existing' | 'overwrite' | 'create_new')}
                    className="mr-2"
                  />
                  <span className="text-sm">Create new copies</span>
                </label>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              onClick={triggerFileSelect}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              {loading ? 'Importing...' : 'Select Import File'}
            </Button>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-800">Import Results</h4>
              <button
                onClick={clearImportResult}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Clear results"
              >
                ×
              </button>
            </div>

            <div className={`p-4 rounded-md ${
              importResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-sm ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                <p className="font-medium mb-2">{importResult.message}</p>
                
                {importResult.success && (
                  <div className="space-y-1">
                    <p>• Songs imported: {importResult.songsImported}</p>
                    <p>• Setlists imported: {importResult.setlistsImported}</p>
                    <p>• Preferences imported: {importResult.preferencesImported}</p>
                  </div>
                )}

                {importResult.conflicts.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium">Conflicts resolved:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {importResult.conflicts.map((conflict, index) => (
                        <li key={index} className="text-xs">
                          {conflict.type} "{conflict.id}": {conflict.resolution.replace('_', ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-red-700">Errors:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-xs text-red-600">
                          {error.type} "{error.id}": {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h5 className="font-medium text-gray-800 mb-2">Tips:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Export data regularly as a backup</li>
          <li>• Import files must be in HSA Songbook JSON format</li>
          <li>• Large imports may take a few moments to complete</li>
          <li>• Existing favorites and recent items are preserved during cleanup</li>
        </ul>
      </div>
    </Card>
  );
}

/**
 * Simple export button component
 */
interface ExportButtonProps {
  userId: string;
  className?: string;
  children?: React.ReactNode;
  onComplete?: () => void;
}

export function ExportButton({ 
  userId, 
  className = '', 
  children = 'Export Data',
  onComplete 
}: ExportButtonProps) {
  const { loading, downloadExport } = useDataPortability(userId);

  const handleClick = async () => {
    const success = await downloadExport();
    if (success) {
      onComplete?.();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Exporting...' : children}
    </Button>
  );
}

/**
 * Simple import button component
 */
interface ImportButtonProps {
  userId: string;
  className?: string;
  children?: React.ReactNode;
  onComplete?: (result: ImportResult) => void;
  conflictResolution?: 'keep_existing' | 'overwrite' | 'create_new';
}

export function ImportButton({ 
  userId, 
  className = '', 
  children = 'Import Data',
  onComplete,
  conflictResolution = 'keep_existing'
}: ImportButtonProps) {
  const { loading, importData } = useDataPortability(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data: ExportData = JSON.parse(content);
      
      const result = await importData(data, { resolveConflicts: conflictResolution });
      if (result) {
        onComplete?.(result);
      }
    } catch (err) {
      showError('Import Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [importData, conflictResolution, onComplete]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className={className}
      >
        {loading ? 'Importing...' : children}
      </Button>
    </>
  );
}