/**
 * @file src/features/setlists/__tests__/setlist-store.test.ts
 * @description Tests for setlist Zustand store
 */

import { useSetlistStore } from '../stores/setlist-store';
import type { Setlist, SetlistItem } from '../types';

describe('Setlist Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSetlistStore.getState().clearSetlist();
  });

  describe('Setlist Creation', () => {
    it('creates a new empty setlist', () => {
      const { createSetlist } = useSetlistStore.getState();
      
      createSetlist('Test Setlist', 'user123');
      
      const setlist = useSetlistStore.getState().state.setlist;
      expect(setlist.name).toBe('Test Setlist');
      expect(setlist.createdBy).toBe('user123');
      expect(setlist.songs).toHaveLength(0);
      expect(setlist.hasUnsavedChanges).toBe(false);
    });

    it('loads an existing setlist', () => {
      const existingSetlist: Setlist = {
        id: 'existing-id',
        name: 'Existing Setlist',
        description: 'Test description',
        songs: [
          {
            id: 'song1',
            songId: 'song1',
            songTitle: 'Amazing Grace',
            transpose: 0,
            order: 0
          }
        ],
        tags: ['test'],
        isPublic: false,
        estimatedDuration: 15,
        usageCount: 1,
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced',
        hasUnsavedChanges: false
      };

      const { loadSetlist } = useSetlistStore.getState();
      loadSetlist(existingSetlist);

      const setlist = useSetlistStore.getState().state.setlist;
      expect(setlist).toEqual(existingSetlist);
    });
  });

  describe('Song Operations', () => {
    beforeEach(() => {
      const { createSetlist } = useSetlistStore.getState();
      createSetlist('Test Setlist', 'user123');
    });

    it('adds a song to the setlist', () => {
      const { addSong } = useSetlistStore.getState();
      
      addSong({
        songId: 'song1',
        transpose: 2
      });

      const songs = useSetlistStore.getState().state.setlist.songs;
      expect(songs).toHaveLength(1);
      expect(songs[0].songId).toBe('song1');
      expect(songs[0].transpose).toBe(2);
      expect(songs[0].order).toBe(0);
    });

    it('adds song at specific index', () => {
      const { addSong } = useSetlistStore.getState();
      
      // Add first song
      addSong({ songId: 'song1', transpose: 0 });
      // Add second song
      addSong({ songId: 'song2', transpose: 0 });
      // Insert song at index 1
      addSong({ songId: 'song3', transpose: 0, insertAtIndex: 1 });

      const songs = useSetlistStore.getState().state.setlist.songs;
      expect(songs).toHaveLength(3);
      expect(songs[0].songId).toBe('song1');
      expect(songs[1].songId).toBe('song3');
      expect(songs[2].songId).toBe('song2');
      
      // Check order values are correct
      expect(songs[0].order).toBe(0);
      expect(songs[1].order).toBe(1);
      expect(songs[2].order).toBe(2);
    });

    it('removes a song from the setlist', () => {
      const { addSong, removeSong } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      addSong({ songId: 'song2', transpose: 0 });
      
      removeSong('song1');

      const songs = useSetlistStore.getState().state.setlist.songs;
      expect(songs).toHaveLength(1);
      expect(songs[0].songId).toBe('song2');
      expect(songs[0].order).toBe(0); // Should be reordered
    });

    it('updates a song in the setlist', () => {
      const { addSong, updateSong } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      updateSong('song1', { transpose: 3, notes: 'Test notes' });

      const songs = useSetlistStore.getState().state.setlist.songs;
      expect(songs[0].transpose).toBe(3);
      expect(songs[0].notes).toBe('Test notes');
    });

    it('reorders songs correctly', () => {
      const { addSong, reorderSongs } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      addSong({ songId: 'song2', transpose: 0 });
      addSong({ songId: 'song3', transpose: 0 });

      // Move song from index 0 to index 2
      reorderSongs({
        sourceIndex: 0,
        destinationIndex: 2,
        songId: 'song1'
      });

      const songs = useSetlistStore.getState().state.setlist.songs;
      expect(songs[0].songId).toBe('song2');
      expect(songs[1].songId).toBe('song3');
      expect(songs[2].songId).toBe('song1');
      
      // Check order values are updated
      expect(songs[0].order).toBe(0);
      expect(songs[1].order).toBe(1);
      expect(songs[2].order).toBe(2);
    });
  });

  describe('Undo/Redo Functionality', () => {
    beforeEach(() => {
      const { createSetlist } = useSetlistStore.getState();
      createSetlist('Test Setlist', 'user123');
    });

    it('supports undo after adding song', () => {
      const { addSong, undo } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      expect(useSetlistStore.getState().state.setlist.songs).toHaveLength(1);
      expect(useSetlistStore.getState().undoRedoState.canUndo).toBe(true);
      
      undo();
      expect(useSetlistStore.getState().state.setlist.songs).toHaveLength(0);
      expect(useSetlistStore.getState().undoRedoState.canRedo).toBe(true);
    });

    it('supports redo after undo', () => {
      const { addSong, undo, redo } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      undo();
      redo();
      
      expect(useSetlistStore.getState().state.setlist.songs).toHaveLength(1);
      expect(useSetlistStore.getState().undoRedoState.canUndo).toBe(true);
      expect(useSetlistStore.getState().undoRedoState.canRedo).toBe(false);
    });

    it('clears redo history when new action is performed', () => {
      const { addSong, undo } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      addSong({ songId: 'song2', transpose: 0 });
      undo(); // Now we have redo available
      
      expect(useSetlistStore.getState().undoRedoState.canRedo).toBe(true);
      
      addSong({ songId: 'song3', transpose: 0 }); // This should clear redo
      
      expect(useSetlistStore.getState().undoRedoState.canRedo).toBe(false);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      const { createSetlist } = useSetlistStore.getState();
      createSetlist('Test Setlist', 'user123');
    });

    it('validates empty setlist name', () => {
      const { updateSetlistInfo } = useSetlistStore.getState();
      
      updateSetlistInfo({ name: '' });
      
      const validation = useSetlistStore.getState().state.validation;
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: 'Setlist name is required'
        })
      );
    });

    it('validates setlist name length', () => {
      const { updateSetlistInfo } = useSetlistStore.getState();
      
      updateSetlistInfo({ name: 'a'.repeat(201) }); // Too long
      
      const validation = useSetlistStore.getState().state.validation;
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: 'Setlist name cannot exceed 200 characters'
        })
      );
    });
  });

  describe('Duplicate Detection', () => {
    beforeEach(() => {
      const { createSetlist } = useSetlistStore.getState();
      createSetlist('Test Setlist', 'user123');
    });

    it('detects duplicate songs', () => {
      const { addSong } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      addSong({ songId: 'song1', transpose: 2 }); // Same song, different transpose
      
      const duplicates = useSetlistStore.getState().state.duplicates;
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].songId).toBe('song1');
      expect(duplicates[0].occurrences).toHaveLength(2);
    });

    it('warns about duplicates in validation', () => {
      const { addSong } = useSetlistStore.getState();
      
      addSong({ songId: 'song1', transpose: 0 });
      addSong({ songId: 'song1', transpose: 2 });
      
      const validation = useSetlistStore.getState().state.validation;
      expect(validation.warnings).toContainEqual(
        expect.objectContaining({
          type: 'duplicate_song',
          message: '1 duplicate song(s) detected'
        })
      );
    });
  });

  describe('Time Estimation', () => {
    beforeEach(() => {
      const { createSetlist } = useSetlistStore.getState();
      createSetlist('Test Setlist', 'user123');
    });

    it('calculates time estimation for songs', () => {
      const { addSong } = useSetlistStore.getState();
      
      // Add song with tempo
      addSong({ 
        songId: 'song1', 
        transpose: 0,
        tempo: 120
      });
      
      const timeEstimation = useSetlistStore.getState().state.timeEstimation;
      expect(timeEstimation.totalMinutes).toBeGreaterThan(0);
      expect(timeEstimation.breakdown).toHaveLength(1);
    });

    it('formats time estimation correctly', () => {
      const { addSong } = useSetlistStore.getState();
      
      // Add multiple songs to get meaningful duration
      addSong({ songId: 'song1', transpose: 0 });
      addSong({ songId: 'song2', transpose: 0 });
      
      const timeEstimation = useSetlistStore.getState().state.timeEstimation;
      expect(timeEstimation.formatted).toMatch(/^\d+m$/); // Should be in format like "7m"
    });
  });

  describe('Drag State Management', () => {
    it('manages drag state correctly', () => {
      const { setDragState, resetDragState } = useSetlistStore.getState();
      
      setDragState({ isDragging: true, draggedItemId: 'song1' });
      
      let dragState = useSetlistStore.getState().state.dragState;
      expect(dragState.isDragging).toBe(true);
      expect(dragState.draggedItemId).toBe('song1');
      
      resetDragState();
      
      dragState = useSetlistStore.getState().state.dragState;
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedItemId).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('sets and clears errors', () => {
      const { setError, clearError } = useSetlistStore.getState();
      
      const testError = {
        code: 'VALIDATION_ERROR' as const,
        message: 'Test error',
        recoverable: true
      };
      
      setError(testError);
      expect(useSetlistStore.getState().error).toEqual(testError);
      
      clearError();
      expect(useSetlistStore.getState().error).toBeNull();
    });
  });

  describe('Keyboard Navigation', () => {
    it('manages keyboard navigation state', () => {
      const { navigateKeyboard, selectCurrentItem } = useSetlistStore.getState();
      
      navigateKeyboard('down');
      
      let keyboardState = useSetlistStore.getState().state.keyboardState;
      expect(keyboardState.focusedItemIndex).toBe(1);
      expect(keyboardState.lastAction).toBe('down');
      
      navigateKeyboard('up');
      
      keyboardState = useSetlistStore.getState().state.keyboardState;
      expect(keyboardState.focusedItemIndex).toBe(0);
      
      selectCurrentItem();
      
      keyboardState = useSetlistStore.getState().state.keyboardState;
      expect(keyboardState.lastAction).toBe('select');
    });
  });
});