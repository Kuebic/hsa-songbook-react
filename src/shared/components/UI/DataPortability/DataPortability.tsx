/**
 * @file DataPortability.tsx
 * @description Refactored component for data export/import functionality
 */

import { Card } from '../Card';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';
import { DataManagementTips } from './DataManagementTips';
import type { ExportData, ImportResult } from '../../../types/storage.types';

export interface DataPortabilityProps {
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
  if (!showImport && !showExport) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📦</span>
        Data Management
      </h3>

      <div className="space-y-6">
        {showExport && (
          <ExportSection
            userId={userId}
            onExportComplete={onExportComplete}
          />
        )}

        {showImport && showExport && (
          <hr className="border-gray-200" />
        )}

        {showImport && (
          <ImportSection
            userId={userId}
            onImportComplete={onImportComplete}
          />
        )}
      </div>

      <DataManagementTips />
    </Card>
  );
}