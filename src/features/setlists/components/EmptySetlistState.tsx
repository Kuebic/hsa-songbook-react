/**
 * @file src/features/setlists/components/EmptySetlistState.tsx
 * @description Empty state component for setlists with no songs
 */

import React from 'react';
import clsx from 'clsx';

interface EmptySetlistStateProps {
  readOnly?: boolean;
  onAddSong?: () => void;
}

export const EmptySetlistState: React.FC<EmptySetlistStateProps> = ({
  readOnly = false,
  onAddSong
}) => {
  return (
    <div className="empty-setlist-state text-center py-12">
      <div className="max-w-sm mx-auto">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {readOnly ? 'No songs in this setlist' : 'Start building your setlist'}
        </h3>
        
        <p className="text-gray-500 mb-6">
          {readOnly 
            ? 'This setlist is currently empty.'
            : 'Add songs to create your worship setlist. You can search for songs, drag to reorder, and customize each song\'s key and notes.'
          }
        </p>

        {/* Action button */}
        {!readOnly && (
          <button
            onClick={onAddSong}
            className={clsx(
              'inline-flex',
              'items-center',
              'px-4',
              'py-2',
              'bg-blue-600',
              'text-white',
              'rounded-lg',
              'hover:bg-blue-700',
              'transition-colors',
              'font-medium'
            )}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add first song
          </button>
        )}

        {/* Helpful tips */}
        {!readOnly && (
          <div className="mt-8 text-left">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Quick tips:
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Drag and drop songs to reorder them
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Use transpose controls to change keys
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Add performance notes to each song
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Use Ctrl+Z/Ctrl+Y for undo/redo
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptySetlistState;