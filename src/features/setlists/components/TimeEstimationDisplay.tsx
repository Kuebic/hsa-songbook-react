/**
 * @file src/features/setlists/components/TimeEstimationDisplay.tsx
 * @description Display component for setlist time estimation and breakdown
 */

import React, { useState } from 'react';
import clsx from 'clsx';
import { useSetlistTimeEstimation } from '../stores';

export const TimeEstimationDisplay: React.FC = () => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const timeEstimation = useSetlistTimeEstimation();

  // Don't render if no songs or no estimation
  if (timeEstimation.totalMinutes === 0) {
    return null;
  }

  return (
    <div className="time-estimation-display mb-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg 
              className="w-5 h-5 text-green-600 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Estimated Duration
              </h3>
              <p className="text-lg font-semibold text-green-900">
                {timeEstimation.formatted}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className={clsx(
              'text-sm',
              'text-green-600',
              'hover:text-green-800',
              'font-medium',
              'transition-colors',
              'flex',
              'items-center'
            )}
            aria-label={showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
          >
            {showBreakdown ? 'Hide' : 'Show'} breakdown
            <svg 
              className={clsx(
                'w-4',
                'h-4',
                'ml-1',
                'transition-transform',
                {
                  'rotate-180': showBreakdown,
                }
              )}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </button>
        </div>

        {/* Breakdown details */}
        {showBreakdown && (
          <div className="mt-4 pt-3 border-t border-green-200">
            <h4 className="text-xs font-medium text-green-800 mb-2 uppercase tracking-wide">
              Song Breakdown
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timeEstimation.breakdown.map((song, index) => (
                <div 
                  key={song.songId} 
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center min-w-0 flex-grow">
                    <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-green-900 truncate">
                      {song.songTitle}
                    </span>
                  </div>
                  
                  <div className="flex items-center ml-3 flex-shrink-0">
                    <span className="text-green-700 font-mono">
                      {Math.round(song.estimatedMinutes)}m
                    </span>
                    
                    {/* Confidence indicator */}
                    <div className={clsx(
                      'w-2',
                      'h-2',
                      'rounded-full',
                      'ml-2',
                      {
                        'bg-green-500': song.confidence === 'high',
                        'bg-yellow-500': song.confidence === 'medium',
                        'bg-gray-400': song.confidence === 'low',
                      }
                    )} 
                    title={`Confidence: ${song.confidence}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Confidence legend */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-700 mb-2">Estimate confidence:</p>
              <div className="flex items-center gap-4 text-xs text-green-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  High (known duration)
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                  Medium (tempo-based)
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                  Low (estimated)
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="mt-3 pt-3 border-t border-green-200 text-xs text-green-600">
              <p>
                <strong>Note:</strong> Actual performance time may vary based on 
                introductions, transitions, and spontaneous moments.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEstimationDisplay;