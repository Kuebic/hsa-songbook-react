/**
 * @file src/features/setlists/components/SetlistValidationPanel.tsx
 * @description Validation panel showing errors, warnings, and duplicate detection
 */

import React from 'react';
import { useSetlistValidation, useSetlistDuplicates } from '../stores';

export const SetlistValidationPanel: React.FC = () => {
  const validation = useSetlistValidation();
  const duplicates = useSetlistDuplicates();

  // Don't render if no issues
  if (validation.isValid && validation.warnings.length === 0 && duplicates.length === 0) {
    return null;
  }

  return (
    <div className="setlist-validation-panel mb-4">
      {/* Errors */}
      {validation.errors.length > 0 && (
        <div 
          className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                {validation.errors.length === 1 ? 'Error' : `${validation.errors.length} Errors`}
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>
                    <strong>{error.field}:</strong> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                {validation.warnings.length === 1 ? 'Warning' : `${validation.warnings.length} Warnings`}
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>
                    {warning.message}
                    {warning.affectedItems && warning.affectedItems.length > 0 && (
                      <span className="ml-2 text-yellow-600">
                        ({warning.affectedItems.length} songs affected)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Duplicates */}
      {duplicates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Duplicate Songs Detected
              </h3>
              <div className="space-y-3">
                {duplicates.map((duplicate, index) => (
                  <div key={index} className="text-sm">
                    <p className="text-blue-700 font-medium mb-1">
                      "{duplicate.songTitle}" appears {duplicate.occurrences.length} times
                    </p>
                    <ul className="text-blue-600 ml-4 space-y-1">
                      {duplicate.occurrences.map((occurrence, occIndex) => (
                        <li key={occIndex} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                          Position {occurrence.order + 1}
                          {occurrence.transpose !== 0 && (
                            <span className="ml-2 text-xs bg-blue-100 px-1 rounded">
                              {occurrence.transpose > 0 ? '+' : ''}{occurrence.transpose}
                            </span>
                          )}
                          {occurrence.arrangementId && (
                            <span className="ml-2 text-xs text-blue-500">
                              (Different arrangement)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        onClick={() => {
                          // TODO: Implement merge functionality
                          console.log('Merge duplicates:', duplicate.songId);
                        }}
                      >
                        Merge
                      </button>
                      <button
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          // TODO: Implement keep separate functionality
                          console.log('Keep separate:', duplicate.songId);
                        }}
                      >
                        Keep Separate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetlistValidationPanel;