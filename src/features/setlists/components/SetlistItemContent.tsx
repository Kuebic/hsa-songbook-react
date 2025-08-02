/**
 * @file src/features/setlists/components/SetlistItemContent.tsx
 * @description Main content display for setlist items
 */

import React, { useCallback } from 'react';
import clsx from 'clsx';
import type { SetlistItem } from '../types';

interface SetlistItemContentProps {
  song: SetlistItem;
  index: number;
  compactMode?: boolean;
  readOnly?: boolean;
  actionButtons?: React.ReactNode;
}

export const SetlistItemContent: React.FC<SetlistItemContentProps> = ({
  song,
  index,
  compactMode = false,
  readOnly = false,
  actionButtons
}) => {
  // Calculate display key with transpose
  const getDisplayKey = useCallback(() => {
    if (!song.originalKey) return null;
    
    if (song.transpose === 0) {
      return song.originalKey;
    }
    
    // Simple transpose calculation (this would be more complex in real implementation)
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const originalIndex = keys.indexOf(song.originalKey);
    if (originalIndex === -1) return song.originalKey;
    
    const newIndex = (originalIndex + song.transpose + 12) % 12;
    return keys[newIndex];
  }, [song.originalKey, song.transpose]);

  return (
    <>
      {/* Song number */}
      <div className={clsx(
        'flex-shrink-0',
        'w-8',
        'h-8',
        'bg-gray-100',
        'rounded-full',
        'flex',
        'items-center',
        'justify-center',
        'text-sm',
        'font-medium',
        'text-gray-600',
        {
          'w-6 h-6 text-xs': compactMode,
        }
      )}>
        {index + 1}
      </div>

      {/* Song information */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-grow">
            {/* Song title and artist */}
            <h3 className={clsx(
              'font-medium',
              'text-gray-900',
              'truncate',
              {
                'text-sm': compactMode,
              }
            )}>
              {song.songTitle || 'Unknown Song'}
            </h3>
            
            {song.songArtist && (
              <p className={clsx(
                'text-gray-600',
                'truncate',
                'mt-1',
                {
                  'text-xs': compactMode,
                  'text-sm': !compactMode,
                }
              )}>
                {song.songArtist}
              </p>
            )}

            {/* Key and transpose info */}
            <div className="flex items-center gap-2 mt-1">
              {song.originalKey && (
                <span className={clsx(
                  'inline-flex',
                  'items-center',
                  'px-2',
                  'py-1',
                  'bg-blue-100',
                  'text-blue-800',
                  'rounded',
                  'font-mono',
                  {
                    'text-xs px-1 py-0.5': compactMode,
                    'text-sm': !compactMode,
                  }
                )}>
                  {getDisplayKey()}
                  {song.transpose !== 0 && (
                    <span className="ml-1 text-blue-600">
                      ({song.transpose > 0 ? '+' : ''}{song.transpose})
                    </span>
                  )}
                </span>
              )}

              {song.tempo && (
                <span className={clsx(
                  'text-gray-500',
                  'font-mono',
                  {
                    'text-xs': compactMode,
                    'text-sm': !compactMode,
                  }
                )}>
                  {song.tempo} BPM
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons slot */}
          {!readOnly && actionButtons}
        </div>
      </div>
    </>
  );
};

export default SetlistItemContent;