/**
 * @file src/features/setlists/components/DraggableSetlistItem.tsx
 * @description Individual setlist item component with drag functionality and inline controls
 */

import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useSetlistStore } from '../stores';
import type { SetlistItem } from '../types';
import { SetlistItemDragHandle } from './SetlistItemDragHandle';
import { SetlistItemTransposeControls } from './SetlistItemTransposeControls';
import { SetlistItemNotesSection } from './SetlistItemNotesSection';
import { SetlistItemActionButtons } from './SetlistItemActionButtons';
import { SetlistItemContent } from './SetlistItemContent';
import { useSetlistItemKeyboardHandlers } from './SetlistItemKeyboardHandlers';

interface DraggableSetlistItemProps {
  song: SetlistItem;
  index: number;
  readOnly?: boolean;
  compactMode?: boolean;
  isDragging?: boolean;
  isDraggedOver?: boolean;
  isOverlay?: boolean;
  isFocused?: boolean;
  isNavigating?: boolean;
}

export const DraggableSetlistItem: React.FC<DraggableSetlistItemProps> = ({
  song,
  index,
  readOnly = false,
  compactMode = false,
  isDragging = false,
  isDraggedOver = false,
  isOverlay = false,
  isFocused = false,
  isNavigating = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTransposeControls, setShowTransposeControls] = useState(false);
  
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

  // Handle notes save
  const handleNotesSave = useCallback((notes: string) => {
    updateSong(song.songId, { notes });
    setIsEditing(false);
  }, [song.songId, updateSong]);

  // Handle notes cancel
  const handleNotesCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Handle transpose change
  const handleTransposeChange = useCallback((newTranspose: number) => {
    updateSong(song.songId, { transpose: newTranspose });
    
    // Haptic feedback for transpose
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, [song.songId, updateSong]);

  // Handle song removal
  const handleRemove = useCallback(() => {
    removeSong(song.songId);
  }, [song.songId, removeSong]);

  // Setup keyboard handlers
  const { handleKeyDown } = useSetlistItemKeyboardHandlers({
    readOnly,
    isEditing,
    songId: song.id,
    songTitle: song.songTitle,
    showTransposeControls,
    onSetUIState: setUIState,
    onRemove: handleRemove,
    onNotesCancel: handleNotesCancel,
    onSetEditing: setIsEditing,
    onSetShowTransposeControls: setShowTransposeControls
  });

  // Component classes
  const itemClasses = clsx(
    'setlist-item group relative bg-white border border-gray-200 rounded-lg p-4 mb-2 shadow-sm transition-all duration-200',
    {
      'opacity-50': isDragging || isSortableDragging,
      'ring-2 ring-blue-500 ring-offset-2': isFocused && isNavigating,
      'bg-blue-50 border-blue-300': isFocused && !isDragging,
      'ring-2 ring-blue-500 ring-opacity-50': isDraggedOver,
      'shadow-lg border-blue-300': isDragging || isSortableDragging,
      'cursor-grabbing': isDragging,
      'cursor-grab': !readOnly && !isDragging,
      'p-2 text-sm': compactMode,
      'hover:shadow-md hover:border-gray-300': !readOnly && !isDragging,
      'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50': !readOnly,
      'cursor-default bg-gray-50': readOnly,
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
          <SetlistItemDragHandle
            songTitle={song.songTitle}
            compactMode={compactMode}
            attributes={attributes}
            listeners={listeners}
          />
        )}

        {/* Song content */}
        <SetlistItemContent
          song={song}
          index={index}
          compactMode={compactMode}
          readOnly={readOnly}
          actionButtons={
            <SetlistItemActionButtons
              songTitle={song.songTitle}
              compactMode={compactMode}
              showTransposeControls={showTransposeControls}
              isEditing={isEditing}
              hasNotes={!!song.notes}
              onToggleTranspose={() => setShowTransposeControls(!showTransposeControls)}
              onToggleNotes={() => setIsEditing(!isEditing)}
              onRemove={handleRemove}
            />
          }
        />
      </div>

      {/* Transpose controls */}
      {showTransposeControls && !readOnly && (
        <SetlistItemTransposeControls
          currentTranspose={song.transpose}
          onTransposeChange={handleTransposeChange}
        />
      )}

      {/* Notes section */}
      <SetlistItemNotesSection
        notes={song.notes}
        isEditing={isEditing}
        onSave={handleNotesSave}
        onCancel={handleNotesCancel}
      />

      {/* Hidden details for screen readers */}
      <div id={`song-${song.id}-details`} className="sr-only">
        Song {index + 1}. 
        {song.originalKey && `Key: ${song.originalKey}. `}
        {song.tempo && `Tempo: ${song.tempo} BPM. `}
        {song.notes && `Notes: ${song.notes}. `}
        Use arrow keys to navigate, Enter to select, T to toggle transpose, Delete to remove.
      </div>
    </div>
  );
};

export default DraggableSetlistItem;