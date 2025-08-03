/**
 * @file src/features/setlists/components/SetlistItemActionButtons.tsx
 * @description Action buttons component for setlist items
 */

import React from 'react';
import clsx from 'clsx';

interface SetlistItemActionButtonsProps {
  songTitle?: string;
  compactMode?: boolean;
  showTransposeControls: boolean;
  isEditing: boolean;
  hasNotes: boolean;
  onToggleTranspose: () => void;
  onToggleNotes: () => void;
  onRemove: () => void;
}

export const SetlistItemActionButtons: React.FC<SetlistItemActionButtonsProps> = ({
  songTitle,
  compactMode = false,
  showTransposeControls,
  isEditing,
  hasNotes,
  onToggleTranspose,
  onToggleNotes,
  onRemove
}) => {
  return (
    <div className={clsx(
      'flex',
      'items-center',
      'gap-1',
      'ml-2',
      {
        'opacity-0 group-hover:opacity-100': !compactMode,
      }
    )}>
      {/* Transpose button */}
      <button
        onClick={onToggleTranspose}
        className={clsx(
          'p-1',
          'text-gray-400',
          'hover:text-gray-600',
          'rounded',
          'transition-colors',
          {
            'text-blue-600': showTransposeControls,
          }
        )}
        title="Transpose"
        aria-label="Toggle transpose controls"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </button>

      {/* Notes button */}
      <button
        onClick={onToggleNotes}
        className={clsx(
          'p-1',
          'text-gray-400',
          'hover:text-gray-600',
          'rounded',
          'transition-colors',
          {
            'text-blue-600': isEditing || hasNotes,
          }
        )}
        title="Edit notes"
        aria-label="Edit performance notes"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
        title="Remove from setlist"
        aria-label={`Remove ${songTitle || 'song'} from setlist`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default SetlistItemActionButtons;