/**
 * @file src/features/setlists/components/SetlistBuilder.tsx
 * @description Main setlist builder component with drag-drop functionality
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useSetlistStore, useSetlist, useSetlistDragState, useSetlistError, useSetlistKeyboardState } from '../stores';
import type { DragDropResult } from '../types';
import { Card } from '../../../shared/components';
import { DraggableSetlistItem } from './DraggableSetlistItem';
import { SetlistControls } from './SetlistControls';
import { SetlistHeader } from './SetlistHeader';
import { EmptySetlistState } from './EmptySetlistState';
import { SetlistValidationPanel } from './SetlistValidationPanel';
import { TimeEstimationDisplay } from './TimeEstimationDisplay';

interface SetlistBuilderProps {
  setlistId?: string;
  className?: string;
  onSave?: (setlist: any) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  compactMode?: boolean;
}

export const SetlistBuilder: React.FC<SetlistBuilderProps> = ({
  className = '',
  onSave,
  onCancel,
  readOnly = false,
  compactMode = false
}) => {
  const setlist = useSetlist();
  const dragState = useSetlistDragState();
  const keyboardState = useSetlistKeyboardState();
  const error = useSetlistError();
  
  const {
    reorderSongs,
    setDragState,
    resetDragState,
    setUIState,
    validateSetlist,
    recalculateTimeEstimation,
    refreshDuplicateDetection,
    clearError
  } = useSetlistStore();

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Touch delay for better mobile experience
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Set compact mode in store
  useEffect(() => {
    setUIState({ compactView: compactMode });
  }, [compactMode, setUIState]);

  // Validation and calculations on setlist changes
  useEffect(() => {
    validateSetlist();
    recalculateTimeEstimation();
    refreshDuplicateDetection();
  }, [setlist.songs, validateSetlist, recalculateTimeEstimation, refreshDuplicateDetection]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    
    setDragState({
      isDragging: true,
      draggedItemId: active.id as string
    });

    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Clear any errors when starting a drag
    if (error) {
      clearError();
    }
  }, [setDragState, error, clearError]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setDragState({
        dragOverItemId: over.id as string
      });
    }
  }, [setDragState]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    resetDragState();
    
    if (!over || active.id === over.id) {
      return;
    }

    const sourceIndex = setlist.songs.findIndex(song => song.id === active.id);
    const destinationIndex = setlist.songs.findIndex(song => song.id === over.id);

    if (sourceIndex !== -1 && destinationIndex !== -1) {
      const result: DragDropResult = {
        sourceIndex,
        destinationIndex,
        songId: setlist.songs[sourceIndex].songId
      };

      reorderSongs(result);

      // Haptic feedback on reorder
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  }, [setlist.songs, reorderSongs, resetDragState]);

  const handleDragCancel = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  // Memoized song IDs for SortableContext
  const songIds = useMemo(() => setlist.songs.map(song => song.id), [setlist.songs]);

  // Memoized dragged item for DragOverlay
  const draggedItem = useMemo(() => {
    if (!dragState.draggedItemId) return null;
    return setlist.songs.find(song => song.id === dragState.draggedItemId);
  }, [dragState.draggedItemId, setlist.songs]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(setlist);
    }
  }, [onSave, setlist]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when focused on the setlist builder
      if (!document.activeElement?.closest('.setlist-builder')) {
        return;
      }

      // Handle global keyboard shortcuts first
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            if (!readOnly) {
              handleSave();
            }
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              // Redo
              useSetlistStore.getState().redo();
            } else {
              // Undo
              useSetlistStore.getState().undo();
            }
            break;
        }
        return;
      }

      // Handle navigation keys when not in an input/textarea
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      if (!isInInput && !readOnly) {
        const { navigateKeyboard, selectCurrentItem } = useSetlistStore.getState();
        
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault();
            navigateKeyboard('up');
            break;
          case 'ArrowDown':
            event.preventDefault();
            navigateKeyboard('down');
            break;
          case 'Enter':
            event.preventDefault();
            selectCurrentItem();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, handleSave]);

  // Custom drop animation
  const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const containerClasses = `
    setlist-builder 
    ${className}
    ${compactMode ? 'compact-mode' : ''}
    ${readOnly ? 'read-only' : ''}
    ${dragState.isDragging ? 'is-dragging' : ''}
  `.trim();

  return (
    <div 
      className={containerClasses}
      role="application"
      aria-label="Setlist Builder"
      aria-describedby="setlist-instructions"
    >
      {/* Hidden instructions for screen readers */}
      <div id="setlist-instructions" className="sr-only">
        Use drag and drop to reorder songs. Use arrow keys to navigate between songs, Enter to select. 
        For keyboard drag and drop: Tab to a song, press Space to pick up, arrow keys to move, Space to drop.
        Press Ctrl+S to save, Ctrl+Z to undo, Ctrl+Shift+Z to redo.
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              const item = setlist.songs.find(song => song.id === active.id);
              return `Picked up song: ${item?.songTitle || 'Unknown song'}`;
            },
            onDragOver({ active, over }) {
              if (!over) return '';
              const activeItem = setlist.songs.find(song => song.id === active.id);
              const overItem = setlist.songs.find(song => song.id === over.id);
              return `Song ${activeItem?.songTitle || 'Unknown'} is over ${overItem?.songTitle || 'Unknown'}`;
            },
            onDragEnd({ active, over }) {
              if (!over) return 'Song was dropped outside of the list';
              const activeItem = setlist.songs.find(song => song.id === active.id);
              const overItem = setlist.songs.find(song => song.id === over.id);
              return `Song ${activeItem?.songTitle || 'Unknown'} was moved to position of ${overItem?.songTitle || 'Unknown'}`;
            },
            onDragCancel({ active }) {
              const item = setlist.songs.find(song => song.id === active.id);
              return `Movement cancelled. Song ${item?.songTitle || 'Unknown'} returned to its original position.`;
            },
          },
        }}
      >
        <Card className="setlist-builder-card">
          {/* Header with setlist info and actions */}
          <SetlistHeader
            setlist={setlist}
            onSave={handleSave}
            onCancel={handleCancel}
            readOnly={readOnly}
            compactMode={compactMode}
          />

          {/* Validation panel */}
          <SetlistValidationPanel />

          {/* Time estimation display */}
          {!compactMode && <TimeEstimationDisplay />}

          {/* Main content area */}
          <div className="setlist-content">
            {setlist.songs.length === 0 ? (
              <EmptySetlistState readOnly={readOnly} />
            ) : (
              <div className="songs-list">
                <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
                  {setlist.songs.map((song, index) => (
                    <DraggableSetlistItem
                      key={song.id}
                      song={song}
                      index={index}
                      readOnly={readOnly}
                      compactMode={compactMode}
                      isDragging={dragState.isDragging && dragState.draggedItemId === song.id}
                      isDraggedOver={dragState.dragOverItemId === song.id}
                      isFocused={keyboardState.focusedItemIndex === index}
                      isNavigating={keyboardState.isNavigating}
                    />
                  ))}
                </SortableContext>
              </div>
            )}

            {/* Controls for adding songs, etc. */}
            {!readOnly && (
              <SetlistControls
                compactMode={compactMode}
              />
            )}
          </div>

          {/* Drag overlay for smooth dragging animation */}
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {draggedItem && (
              <DraggableSetlistItem
                song={draggedItem}
                index={-1}
                readOnly={readOnly}
                compactMode={compactMode}
                isDragging={true}
                isDraggedOver={false}
                isOverlay={true}
              />
            )}
          </DragOverlay>
        </Card>
      </DndContext>

      {/* Error display */}
      {error && (
        <div 
          className="error-panel mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          {error.suggestedAction && (
            <p className="text-red-600 text-sm mt-2">
              <strong>Suggestion:</strong> {error.suggestedAction}
            </p>
          )}
          {error.recoverable && (
            <button
              onClick={clearError}
              className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SetlistBuilder;