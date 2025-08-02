/**
 * @file ImportResults.tsx
 * @description Component for displaying import operation results
 */

import type { ImportResult } from '../../../types/storage.types';

export interface ImportResultsProps {
  result: ImportResult;
  onClear: () => void;
  className?: string;
}

export function ImportResults({ 
  result, 
  onClear,
  className = '' 
}: ImportResultsProps) {
  return (
    <div className={`mt-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-medium text-gray-800">Import Results</h4>
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          aria-label="Clear results"
        >
          ×
        </button>
      </div>

      <div className={`p-4 rounded-md ${
        result.success 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className={`text-sm ${
          result.success ? 'text-green-800' : 'text-red-800'
        }`}>
          <p className="font-medium mb-2">{result.message}</p>
          
          {result.success && (
            <div className="space-y-1">
              {result.songsImported > 0 && (
                <p>• Songs imported: {result.songsImported}</p>
              )}
              {result.setlistsImported > 0 && (
                <p>• Setlists imported: {result.setlistsImported}</p>
              )}
              {result.preferencesImported > 0 && (
                <p>• Preferences imported: {result.preferencesImported}</p>
              )}
            </div>
          )}

          {result.conflicts.length > 0 && (
            <div className="mt-3">
              <p className="font-medium">Conflicts resolved:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {result.conflicts.map((conflict, index) => (
                  <li key={index} className="text-xs">
                    {conflict.type} "{conflict.id}": {conflict.resolution.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="font-medium text-red-700">Errors:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {result.errors.map((error, index) => (
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
  );
}