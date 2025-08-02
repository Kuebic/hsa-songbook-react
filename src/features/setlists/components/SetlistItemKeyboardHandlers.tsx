/**
 * @file src/features/setlists/components/SetlistItemKeyboardHandlers.tsx
 * @description Keyboard event handlers for setlist items
 */

import { useCallback } from 'react';

interface UseSetlistItemKeyboardHandlersProps {
  readOnly: boolean;
  isEditing: boolean;
  songId: string;
  songTitle?: string;
  showTransposeControls: boolean;
  onSetUIState: (state: { selectedItemId: string }) => void;
  onRemove: () => void;
  onNotesCancel: () => void;
  onSetEditing: (editing: boolean) => void;
  onSetShowTransposeControls: (show: boolean) => void;
}

export const useSetlistItemKeyboardHandlers = ({
  readOnly,
  isEditing,
  songId,
  songTitle,
  showTransposeControls,
  onSetUIState,
  onRemove,
  onNotesCancel,
  onSetEditing,
  onSetShowTransposeControls
}: UseSetlistItemKeyboardHandlersProps) => {
  const handleRemoveWithConfirm = useCallback(() => {
    if (window.confirm(`Remove "${songTitle || 'this song'}" from the setlist?`)) {
      onRemove();
    }
  }, [songTitle, onRemove]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (readOnly) return;

    switch (event.key) {
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          // Ctrl+Enter to edit notes
          event.preventDefault();
          onSetEditing(true);
        } else if (!isEditing) {
          // Enter to select/focus item
          event.preventDefault();
          onSetUIState({ selectedItemId: songId });
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!isEditing && (event.ctrlKey || event.metaKey)) {
          // Ctrl+Delete to remove song
          event.preventDefault();
          handleRemoveWithConfirm();
        }
        break;
      case 'Escape':
        if (isEditing) {
          event.preventDefault();
          onNotesCancel();
        } else {
          onSetShowTransposeControls(false);
        }
        break;
      case 't':
        if (!isEditing && !event.ctrlKey && !event.metaKey) {
          // 't' to toggle transpose controls
          event.preventDefault();
          onSetShowTransposeControls(!showTransposeControls);
        }
        break;
    }
  }, [
    readOnly,
    isEditing,
    songId,
    showTransposeControls,
    onSetUIState,
    handleRemoveWithConfirm,
    onNotesCancel,
    onSetEditing,
    onSetShowTransposeControls
  ]);

  return { handleKeyDown };
};