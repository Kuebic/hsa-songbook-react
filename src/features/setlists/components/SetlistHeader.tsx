/**
 * @file src/features/setlists/components/SetlistHeader.tsx
 * @description Header component for setlist builder with title, actions, and metadata
 */

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { useSetlistStore, useSetlistUndoRedo } from '../stores';
import type { Setlist } from '../types';

interface SetlistHeaderProps {
  setlist: Setlist;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
  compactMode?: boolean;
}

export const SetlistHeader: React.FC<SetlistHeaderProps> = ({
  setlist,
  onSave,
  onCancel,
  readOnly = false,
  compactMode = false
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(setlist.name);
  const [localDescription, setLocalDescription] = useState(setlist.description || '');
  
  const { updateSetlistInfo } = useSetlistStore();
  const { canUndo, canRedo, undo, redo } = useSetlistUndoRedo();

  // Handle name save
  const handleNameSave = useCallback(() => {
    if (localName.trim() !== setlist.name) {
      updateSetlistInfo({ name: localName.trim() });
    }
    setIsEditingName(false);
  }, [localName, setlist.name, updateSetlistInfo]);

  // Handle name cancel
  const handleNameCancel = useCallback(() => {
    setLocalName(setlist.name);
    setIsEditingName(false);
  }, [setlist.name]);

  // Handle description save
  const handleDescriptionSave = useCallback(() => {
    if (localDescription !== setlist.description) {
      updateSetlistInfo({ description: localDescription });
    }
  }, [localDescription, setlist.description, updateSetlistInfo]);

  // Keyboard handlers
  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleNameCancel();
    }
  }, [handleNameSave, handleNameCancel]);

  return (
    <div className={clsx(
      'setlist-header',
      'border-b',
      'border-gray-200',
      'pb-4',
      'mb-4',
      {
        'pb-2 mb-2': compactMode,
      }
    )}>
      <div className="flex items-start justify-between">
        {/* Title and metadata */}
        <div className="flex-grow min-w-0">
          {/* Setlist name */}
          {isEditingName && !readOnly ? (
            <div className="mb-2">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                maxLength={200}
                autoFocus
                aria-label="Setlist name"
              />
            </div>
          ) : (
            <button
              onClick={() => !readOnly && setIsEditingName(true)}
              className={clsx(
                'text-left',
                'w-full',
                'group',
                {
                  'cursor-pointer': !readOnly,
                  'cursor-default': readOnly,
                }
              )}
              disabled={readOnly}
              aria-label={readOnly ? undefined : "Click to edit setlist name"}
            >
              <h1 className={clsx(
                'font-bold',
                'text-gray-900',
                'truncate',
                {
                  'text-2xl': !compactMode,
                  'text-lg': compactMode,
                  'group-hover:text-blue-600': !readOnly,
                }
              )}>
                {setlist.name || 'Untitled Setlist'}
                {!readOnly && (
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </span>
                )}
              </h1>
            </button>
          )}

          {/* Description */}
          {!compactMode && (
            <div className="mt-2">
              {readOnly ? (
                setlist.description && (
                  <p className="text-gray-600 text-sm">{setlist.description}</p>
                )
              ) : (
                <textarea
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  onBlur={handleDescriptionSave}
                  placeholder="Add a description..."
                  className="w-full text-sm text-gray-600 bg-transparent border-none resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded p-1"
                  rows={2}
                  maxLength={1000}
                />
              )}
            </div>
          )}

          {/* Metadata */}
          <div className={clsx(
            'flex',
            'items-center',
            'gap-4',
            'mt-2',
            'text-sm',
            'text-gray-500',
            {
              'gap-2 text-xs': compactMode,
            }
          )}>
            <span>{setlist.songs.length} songs</span>
            
            {setlist.estimatedDuration && setlist.estimatedDuration > 0 && (
              <span>
                ≈ {Math.floor(setlist.estimatedDuration / 60)}h {setlist.estimatedDuration % 60}m
              </span>
            )}
            
            {setlist.hasUnsavedChanges && (
              <span className="text-orange-600 font-medium">Unsaved changes</span>
            )}
            
            {setlist.syncStatus === 'error' && (
              <span className="text-red-600">Sync error</span>
            )}
            
            {setlist.syncStatus === 'pending' && (
              <span className="text-blue-600">Syncing...</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className={clsx(
          'flex',
          'items-center',
          'gap-2',
          'ml-4',
          'flex-shrink-0',
          {
            'gap-1': compactMode,
          }
        )}>
          {/* Undo/Redo */}
          {!readOnly && (
            <>
              <button
                onClick={undo}
                disabled={!canUndo}
                className={clsx(
                  'p-2',
                  'text-gray-400',
                  'hover:text-gray-600',
                  'disabled:opacity-50',
                  'disabled:cursor-not-allowed',
                  'rounded',
                  'transition-colors',
                  {
                    'p-1': compactMode,
                    'text-gray-600': canUndo,
                  }
                )}
                title="Undo (Ctrl+Z)"
                aria-label="Undo last action"
              >
                <svg className={clsx('fill-current', compactMode ? 'w-4 h-4' : 'w-5 h-5')} viewBox="0 0 24 24">
                  <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
                </svg>
              </button>

              <button
                onClick={redo}
                disabled={!canRedo}
                className={clsx(
                  'p-2',
                  'text-gray-400',
                  'hover:text-gray-600',
                  'disabled:opacity-50',
                  'disabled:cursor-not-allowed',
                  'rounded',
                  'transition-colors',
                  {
                    'p-1': compactMode,
                    'text-gray-600': canRedo,
                  }
                )}
                title="Redo (Ctrl+Shift+Z)"
                aria-label="Redo last undone action"
              >
                <svg className={clsx('fill-current', compactMode ? 'w-4 h-4' : 'w-5 h-5')} viewBox="0 0 24 24">
                  <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
                </svg>
              </button>
            </>
          )}

          {/* Save/Cancel buttons */}
          {!readOnly && (onSave || onCancel) && (
            <>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className={clsx(
                    'px-3',
                    'py-1.5',
                    'text-sm',
                    'text-gray-600',
                    'hover:text-gray-800',
                    'border',
                    'border-gray-300',
                    'rounded',
                    'transition-colors',
                    {
                      'px-2 py-1 text-xs': compactMode,
                    }
                  )}
                >
                  Cancel
                </button>
              )}

              {onSave && (
                <button
                  onClick={onSave}
                  className={clsx(
                    'px-3',
                    'py-1.5',
                    'text-sm',
                    'bg-blue-600',
                    'text-white',
                    'hover:bg-blue-700',
                    'rounded',
                    'transition-colors',
                    'font-medium',
                    {
                      'px-2 py-1 text-xs': compactMode,
                    }
                  )}
                  title="Save setlist (Ctrl+S)"
                >
                  Save
                </button>
              )}
            </>
          )}

          {/* Menu button for additional actions */}
          <div className="relative">
            <button
              className={clsx(
                'p-2',
                'text-gray-400',
                'hover:text-gray-600',
                'rounded',
                'transition-colors',
                {
                  'p-1': compactMode,
                }
              )}
              title="More actions"
              aria-label="More setlist actions"
            >
              <svg className={clsx('fill-current', compactMode ? 'w-4 h-4' : 'w-5 h-5')} viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetlistHeader;