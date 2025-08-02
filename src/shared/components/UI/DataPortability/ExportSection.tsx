/**
 * @file ExportSection.tsx
 * @description Export section component for DataPortability
 */

import { Button } from '../Button';
import { useDataExport } from '../../../hooks/useDataExport';
import type { ExportData } from '../../../types/storage.types';

export interface ExportSectionProps {
  userId: string;
  onExportComplete?: (data: ExportData) => void;
  className?: string;
}

export function ExportSection({ 
  userId, 
  onExportComplete,
  className = '' 
}: ExportSectionProps) {
  const { loading, error, exportData, downloadExport } = useDataExport(userId);

  const handleExport = async () => {
    const data = await exportData();
    if (data) {
      onExportComplete?.(data);
    }
  };

  const handleDownloadExport = async () => {
    const success = await downloadExport();
    if (success) {
      const data = await exportData();
      if (data) {
        onExportComplete?.(data);
      }
    }
  };

  return (
    <div className={className}>
      <h4 className="text-lg font-medium mb-3 text-gray-800">Export Data</h4>
      <p className="text-sm text-gray-600 mb-4">
        Export all your setlists, songs, and preferences to a JSON file for backup or transfer.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleDownloadExport}
          disabled={loading}
          variant="primary"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
        >
          {loading ? 'Exporting...' : 'Download Export File'}
        </Button>
        
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="secondary"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
        >
          {loading ? 'Preparing...' : 'Get Export Data'}
        </Button>
      </div>
    </div>
  );
}