/**
 * @file src/features/setlists/components/DraggableSetlistItem.tsx
 * @description Individual setlist item component with drag functionality and inline controls
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useSetlistStore } from '../stores';
import type { SetlistItem } from '../types';

interface DraggableSetlistItemProps {
  song: SetlistItem;
  index: number;
  readOnly?: boolean;
  compactMode?: boolean;
  isDragging?: boolean;
  isDraggedOver?: boolean;
  isOverlay?: boolean;
}

export const DraggableSetlistItem: React.FC<DraggableSetlistItemProps> = ({
  song,
  index,
  readOnly = false,
  compactMode = false,
  isDragging = false,
  isDraggedOver = false,
  isOverlay = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(song.notes || '');
  const [localTranspose, setLocalTranspose] = useState(song.transpose);
  const [showTransposeControls, setShowTransposeControls] = useState(false);
  
  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  const { updateSong, removeSong, setUIState } = useSetlistStore();

  // Set up sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ 
    id: song.id,
    disabled: readOnly || isOverlay
  });

  // Transform and transition styles for drag animation
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  // Auto-focus notes input when editing starts
  useEffect(() => {
    if (isEditing && notesInputRef.current) {
      notesInputRef.current.focus();
    }
  }, [isEditing]);

  // Handle notes save
  const handleNotesSave = useCallback(() => {
    if (localNotes !== song.notes) {
      updateSong(song.songId, { notes: localNotes });
    }
    setIsEditing(false);
  }, [localNotes, song.notes, song.songId, updateSong]);

  // Handle notes cancel
  const handleNotesCancel = useCallback(() => {
    setLocalNotes(song.notes || '');
    setIsEditing(false);
  }, [song.notes]);

  // Handle transpose change
  const handleTransposeChange = useCallback((newTranspose: number) => {
    setLocalTranspose(newTranspose);
    updateSong(song.songId, { transpose: newTranspose });
    
    // Haptic feedback for transpose
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, [song.songId, updateSong]);

  // Handle song removal
  const handleRemove = useCallback(() => {
    if (window.confirm(`Remove "${song.songTitle || 'this song'}" from the setlist?`)) {
      removeSong(song.songId);
    }
  }, [song.songId, song.songTitle, removeSong]);

  // Handle keyboard interactions
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (readOnly) return;

    switch (event.key) {
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          // Ctrl+Enter to edit notes
          event.preventDefault();
          setIsEditing(true);
        } else if (!isEditing) {
          // Enter to select/focus item
          event.preventDefault();
          setUIState({ selectedItemId: song.id });
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!isEditing && (event.ctrlKey || event.metaKey)) {
          // Ctrl+Delete to remove song
          event.preventDefault();
          handleRemove();
        }
        break;
      case 'Escape':
        if (isEditing) {
          event.preventDefault();
          handleNotesCancel();
        } else {
          setShowTransposeControls(false);
        }
        break;
      case 't':
        if (!isEditing && !event.ctrlKey && !event.metaKey) {
          // 't' to toggle transpose controls
          event.preventDefault();
          setShowTransposeControls(!showTransposeControls);
        }
        break;
    }
  }, [readOnly, isEditing, song.id, setUIState, handleRemove, handleNotesCancel, showTransposeControls]);

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

  // Component classes
  const itemClasses = clsx(
    'setlist-item',
    'group',
    'relative',
    'bg-white',
    'border',
    'border-gray-200',
    'rounded-lg',
    'p-4',
    'mb-2',
    'shadow-sm',
    'transition-all',
    'duration-200',
    {
      // Drag states
      'opacity-50': isDragging || isSortableDragging,
      'ring-2 ring-blue-500 ring-opacity-50': isDraggedOver,
      'shadow-lg border-blue-300': isDragging || isSortableDragging,
      'cursor-grabbing': isDragging,
      'cursor-grab': !readOnly && !isDragging,
      
      // Compact mode
      'p-2 text-sm': compactMode,
      
      // Interactive states
      'hover:shadow-md hover:border-gray-300': !readOnly && !isDragging,
      'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50': !readOnly,
      
      // Read-only state
      'cursor-default': readOnly,
      'bg-gray-50': readOnly,
    }
  );

  const dragHandleClasses = clsx(
    'drag-handle',
    'w-6',
    'h-6',
    'text-gray-400',
    'hover:text-gray-600',
    'cursor-grab',
    'active:cursor-grabbing',
    'transition-colors',
    'flex',
    'items-center',
    'justify-center',
    {
      'opacity-0 group-hover:opacity-100': !compactMode,
      'w-4 h-4': compactMode,
    }
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={itemClasses}
      onKeyDown={handleKeyDown}
      tabIndex={readOnly ? -1 : 0}
      role="listitem"
      aria-label={`Song ${index + 1}: ${song.songTitle || 'Unknown song'}`}
      aria-describedby={`song-${song.id}-details`}
    >
      {/* Main song content */}
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {!readOnly && (
          <button
            className={dragHandleClasses}
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${song.songTitle || 'song'}`}
            title="Drag to reorder"
          >
            <svg
              viewBox="0 0 20 20"
              className="w-full h-full"
              fill="currentColor"
            >
              <path d="M7 7a1 1 0 000 2h6a1 1 0 100-2H7zM7 11a1 1 0 100 2h6a1 1 0 100-2H7z" />
            </svg>
          </button>
        )}

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

            {/* Action buttons */}
            {!readOnly && (
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
                  onClick={() => setShowTransposeControls(!showTransposeControls)}
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
                  onClick={() => setIsEditing(!isEditing)}
                  className={clsx(
                    'p-1',
                    'text-gray-400',
                    'hover:text-gray-600',
                    'rounded',
                    'transition-colors',
                    {
                      'text-blue-600': isEditing || song.notes,
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
                  onClick={handleRemove}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                  title="Remove from setlist"
                  aria-label={`Remove ${song.songTitle || 'song'} from setlist`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Transpose controls */}
          {showTransposeControls && !readOnly && (
            <div className="mt-3 p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Transpose:
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTransposeChange(Math.max(-11, localTranspose - 1))}
                    disabled={localTranspose <= -11}
                    className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Transpose down"
                  >
                    −
                  </button>
                  
                  <span className="w-12 text-center font-mono text-sm">
                    {localTranspose > 0 ? '+' : ''}{localTranspose}
                  </span>
                  
                  <button
                    onClick={() => handleTransposeChange(Math.min(11, localTranspose + 1))}
                    disabled={localTranspose >= 11}
                    className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Transpose up"
                  >
                    +
                  </button>
                  
                  {localTranspose !== 0 && (
                    <button
                      onClick={() => handleTransposeChange(0)}
                      className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes section */}
          {(isEditing || song.notes) && (
            <div className="mt-3">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={notesInputRef}
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Add performance notes..."
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleNotesCancel}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNotesSave}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                song.notes && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
                    <p className="whitespace-pre-wrap">{song.notes}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden details for screen readers */}
      <div id={`song-${song.id}-details`} className="sr-only">
        Song {index + 1} of {/* This would need the total count from parent */}. 
        {song.originalKey && `Key: ${getDisplayKey()}. `}
        {song.tempo && `Tempo: ${song.tempo} BPM. `}
        {song.notes && `Notes: ${song.notes}. `}
        Use arrow keys to navigate, Enter to select, T to toggle transpose, Delete to remove.
      </div>
    </div>
  );
};

export default DraggableSetlistItem;