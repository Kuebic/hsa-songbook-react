/**
 * @file src/features/setlists/stores/setlist-store.ts
 * @description Zustand store for setlist management with undo/redo support
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Setlist,
  SetlistItem,
  SetlistBuilderState,
  UndoRedoState,
  DragDropResult,
  AddSongToSetlistParams,
  SetlistValidation,
  TimeEstimation,
  DuplicateInfo,
  SetlistError,
  SetlistBuilderConfig
} from '../types';

// Default configuration
const DEFAULT_CONFIG: SetlistBuilderConfig = {
  maxSongs: 100,
  autoSaveDelay: 2000, // 2 seconds
  dragThreshold: 5,
  touchDragDelay: 150,
  keyboardScrollSpeed: 3,
  enableHapticFeedback: true,
  enableAnimations: true,
  enableVirtualization: true,
  virtualizationThreshold: 50
};

// Create an empty setlist
const createEmptySetlist = (name = 'New Setlist', userId: string): Setlist => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  description: '',
  songs: [],
  tags: [],
  isPublic: false,
  estimatedDuration: 0,
  usageCount: 0,
  createdBy: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  syncStatus: 'pending',
  hasUnsavedChanges: false
});

// Validation functions
const validateSetlist = (setlist: Setlist): SetlistValidation => {
  const errors: SetlistValidation['errors'] = [];
  const warnings: SetlistValidation['warnings'] = [];

  // Check setlist name
  if (!setlist.name.trim()) {
    errors.push({
      field: 'name',
      message: 'Setlist name is required',
      severity: 'error'
    });
  }

  if (setlist.name.length > 200) {
    errors.push({
      field: 'name',
      message: 'Setlist name cannot exceed 200 characters',
      severity: 'error'
    });
  }

  // Check song count
  if (setlist.songs.length > DEFAULT_CONFIG.maxSongs) {
    errors.push({
      field: 'songs',
      message: `Cannot exceed ${DEFAULT_CONFIG.maxSongs} songs`,
      severity: 'error'
    });
  }

  // Check for duplicates
  const songIds = setlist.songs.map(s => s.songId);
  const duplicates = songIds.filter((id, index) => songIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    warnings.push({
      type: 'duplicate_song',
      message: `${duplicates.length} duplicate song(s) detected`,
      affectedItems: [...new Set(duplicates)]
    });
  }

  // Check duration
  if (setlist.estimatedDuration && setlist.estimatedDuration > 180) {
    warnings.push({
      type: 'long_duration',
      message: 'Setlist duration exceeds 3 hours',
      affectedItems: []
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Time estimation function
const calculateTimeEstimation = (songs: SetlistItem[]): TimeEstimation => {
  let totalSeconds = 0;
  const breakdown: TimeEstimation['breakdown'] = [];

  songs.forEach(song => {
    let estimatedMinutes = 3.5; // Default duration
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (song.estimatedDuration) {
      estimatedMinutes = song.estimatedDuration / 60;
      confidence = 'high';
    } else if (song.tempo) {
      // Estimate based on tempo
      if (song.tempo < 80) estimatedMinutes = 4.5;
      else if (song.tempo > 140) estimatedMinutes = 2.5;
      confidence = 'medium';
    }

    const songSeconds = Math.round(estimatedMinutes * 60);
    totalSeconds += songSeconds;

    breakdown.push({
      songId: song.songId,
      songTitle: song.songTitle || 'Unknown Song',
      estimatedMinutes,
      confidence
    });
  });

  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const formatted = hours > 0 
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;

  return {
    totalMinutes,
    totalSeconds,
    formatted,
    breakdown
  };
};

// Duplicate detection function
const detectDuplicates = (songs: SetlistItem[]): DuplicateInfo[] => {
  const songMap = new Map<string, SetlistItem[]>();
  
  // Group songs by songId
  songs.forEach(song => {
    const existing = songMap.get(song.songId) || [];
    songMap.set(song.songId, [...existing, song]);
  });

  // Find duplicates
  const duplicates: DuplicateInfo[] = [];
  songMap.forEach((occurrences, songId) => {
    if (occurrences.length > 1) {
      duplicates.push({
        songId,
        songTitle: occurrences[0].songTitle || 'Unknown Song',
        occurrences: occurrences.map(song => ({
          itemId: song.id,
          order: song.order,
          arrangementId: song.arrangementId,
          transpose: song.transpose
        })),
        suggestedAction: 'merge' // Default suggestion
      });
    }
  });

  return duplicates;
};

// Store interface
interface SetlistStore {
  // State
  state: SetlistBuilderState;
  undoRedoState: UndoRedoState<Setlist>;
  config: SetlistBuilderConfig;
  error: SetlistError | null;

  // Setlist operations
  createSetlist: (name: string, userId: string) => void;
  loadSetlist: (setlist: Setlist) => void;
  updateSetlistInfo: (updates: Partial<Pick<Setlist, 'name' | 'description' | 'tags' | 'isPublic'>>) => void;
  clearSetlist: () => void;

  // Song operations
  addSong: (params: AddSongToSetlistParams) => void;
  removeSong: (songId: string) => void;
  updateSong: (songId: string, updates: Partial<SetlistItem>) => void;
  reorderSongs: (result: DragDropResult) => void;
  reorderSongsByArray: (newOrder: string[]) => void; // For keyboard reordering

  // Drag and drop
  setDragState: (state: Partial<SetlistBuilderState['dragState']>) => void;
  resetDragState: () => void;

  // Touch/mobile
  setTouchState: (state: Partial<SetlistBuilderState['touchState']>) => void;
  resetTouchState: () => void;

  // Keyboard navigation
  setKeyboardState: (state: Partial<SetlistBuilderState['keyboardState']>) => void;
  navigateKeyboard: (direction: 'up' | 'down') => void;
  selectCurrentItem: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
  clearHistory: () => void;

  // UI state
  setUIState: (state: Partial<Pick<SetlistBuilderState, 
    'isLoading' | 'isSaving' | 'showDuplicateWarnings' | 'showTimeEstimation' | 
    'compactView' | 'showMobileControls' | 'mobileBottomSheetOpen' | 'selectedItemId'>>) => void;

  // Validation and calculations
  validateSetlist: () => void;
  recalculateTimeEstimation: () => void;
  refreshDuplicateDetection: () => void;

  // Configuration
  updateConfig: (config: Partial<SetlistBuilderConfig>) => void;

  // Error handling
  setError: (error: SetlistError | null) => void;
  clearError: () => void;
}

export const useSetlistStore = create<SetlistStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        state: {
          setlist: createEmptySetlist('', ''),
          dragState: {
            isDragging: false
          },
          touchState: {
            isActive: false,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            hapticFeedback: true
          },
          keyboardState: {
            focusedItemIndex: 0,
            isNavigating: false,
            lastAction: 'none'
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: []
          },
          timeEstimation: {
            totalMinutes: 0,
            totalSeconds: 0,
            formatted: '0m',
            breakdown: []
          },
          duplicates: [],
          isLoading: false,
          isSaving: false,
          showDuplicateWarnings: true,
          showTimeEstimation: true,
          compactView: false,
          showMobileControls: false,
          mobileBottomSheetOpen: false
        },

        undoRedoState: {
          past: [],
          present: createEmptySetlist('', ''),
          future: [],
          canUndo: false,
          canRedo: false
        },

        config: DEFAULT_CONFIG,
        error: null,

        // Setlist operations
        createSetlist: (name: string, userId: string) => {
          set(state => {
            const newSetlist = createEmptySetlist(name, userId);
            state.state.setlist = newSetlist;
            state.undoRedoState.present = newSetlist;
            state.undoRedoState.past = [];
            state.undoRedoState.future = [];
            state.undoRedoState.canUndo = false;
            state.undoRedoState.canRedo = false;
            state.error = null;
          });
          get().validateSetlist();
        },

        loadSetlist: (setlist: Setlist) => {
          set(state => {
            state.state.setlist = { ...setlist };
            state.undoRedoState.present = { ...setlist };
            state.undoRedoState.past = [];
            state.undoRedoState.future = [];
            state.undoRedoState.canUndo = false;
            state.undoRedoState.canRedo = false;
            state.error = null;
          });
          get().validateSetlist();
          get().recalculateTimeEstimation();
          get().refreshDuplicateDetection();
        },

        updateSetlistInfo: (updates) => {
          set(state => {
            Object.assign(state.state.setlist, updates);
            state.state.setlist.updatedAt = new Date();
            state.state.setlist.hasUnsavedChanges = true;
          });
          get().pushToHistory();
          get().validateSetlist();
        },

        clearSetlist: () => {
          set(state => {
            const emptySetlist = createEmptySetlist('', '');
            state.state.setlist = emptySetlist;
            state.undoRedoState.present = emptySetlist;
            state.undoRedoState.past = [];
            state.undoRedoState.future = [];
            state.undoRedoState.canUndo = false;
            state.undoRedoState.canRedo = false;
            state.error = null;
          });
        },

        // Song operations
        addSong: (params: AddSongToSetlistParams) => {
          set(state => {
            const { setlist } = state.state;
            const insertIndex = params.insertAtIndex ?? setlist.songs.length;
            
            const newSong: SetlistItem = {
              id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              songId: params.songId,
              arrangementId: params.arrangementId,
              transpose: params.transpose || 0,
              notes: params.notes,
              order: insertIndex
            };

            // Insert song at specified position
            setlist.songs.splice(insertIndex, 0, newSong);
            
            // Reorder all songs
            setlist.songs.forEach((song: SetlistItem, index: number) => {
              song.order = index;
            });

            setlist.updatedAt = new Date();
            setlist.hasUnsavedChanges = true;
          });
          
          get().pushToHistory();
          get().validateSetlist();
          get().recalculateTimeEstimation();
          get().refreshDuplicateDetection();
        },

        removeSong: (songId: string) => {
          set(state => {
            const { setlist } = state.state;
            const songIndex = setlist.songs.findIndex((s: SetlistItem) => s.songId === songId);
            
            if (songIndex !== -1) {
              setlist.songs.splice(songIndex, 1);
              
              // Reorder remaining songs
              setlist.songs.forEach((song: SetlistItem, index: number) => {
                song.order = index;
              });

              setlist.updatedAt = new Date();
              setlist.hasUnsavedChanges = true;
            }
          });
          
          get().pushToHistory();
          get().validateSetlist();
          get().recalculateTimeEstimation();
          get().refreshDuplicateDetection();
        },

        updateSong: (songId: string, updates: Partial<SetlistItem>) => {
          set(state => {
            const { setlist } = state.state;
            const songIndex = setlist.songs.findIndex((s: SetlistItem) => s.songId === songId);
            
            if (songIndex !== -1) {
              Object.assign(setlist.songs[songIndex], updates);
              setlist.updatedAt = new Date();
              setlist.hasUnsavedChanges = true;
            }
          });
          
          get().pushToHistory();
          get().validateSetlist();
          get().recalculateTimeEstimation();
        },

        reorderSongs: (result: DragDropResult) => {
          set(state => {
            const { setlist } = state.state;
            const { sourceIndex, destinationIndex } = result;
            
            if (sourceIndex !== destinationIndex) {
              // Remove from source position
              const [movedSong] = setlist.songs.splice(sourceIndex, 1);
              
              // Insert at destination position
              setlist.songs.splice(destinationIndex, 0, movedSong);
              
              // Update all order values
              setlist.songs.forEach((song: SetlistItem, index: number) => {
                song.order = index;
              });

              setlist.updatedAt = new Date();
              setlist.hasUnsavedChanges = true;
            }
          });
          
          get().pushToHistory();
        },

        reorderSongsByArray: (newOrder: string[]) => {
          set(state => {
            const { setlist } = state.state;
            const songMap = new Map(setlist.songs.map((song: SetlistItem) => [song.songId, song]));
            
            setlist.songs = newOrder
              .map(songId => songMap.get(songId))
              .filter((song): song is SetlistItem => song !== undefined);
            
            // Update order values
            setlist.songs.forEach((song: SetlistItem, index: number) => {
              song.order = index;
            });

            setlist.updatedAt = new Date();
            setlist.hasUnsavedChanges = true;
          });
          
          get().pushToHistory();
        },

        // Drag and drop
        setDragState: (dragState) => {
          set(state => {
            Object.assign(state.state.dragState, dragState);
          });
        },

        resetDragState: () => {
          set(state => {
            state.state.dragState = {
              isDragging: false
            };
          });
        },

        // Touch/mobile
        setTouchState: (touchState) => {
          set(state => {
            Object.assign(state.state.touchState, touchState);
          });
        },

        resetTouchState: () => {
          set(state => {
            state.state.touchState = {
              isActive: false,
              startPosition: { x: 0, y: 0 },
              currentPosition: { x: 0, y: 0 },
              hapticFeedback: true
            };
          });
        },

        // Keyboard navigation
        setKeyboardState: (keyboardState) => {
          set(state => {
            Object.assign(state.state.keyboardState, keyboardState);
          });
        },

        navigateKeyboard: (direction: 'up' | 'down') => {
          set(state => {
            const { keyboardState, setlist } = state.state;
            const maxIndex = setlist.songs.length - 1;
            
            if (direction === 'up' && keyboardState.focusedItemIndex > 0) {
              keyboardState.focusedItemIndex -= 1;
            } else if (direction === 'down' && keyboardState.focusedItemIndex < maxIndex) {
              keyboardState.focusedItemIndex += 1;
            }
            
            keyboardState.lastAction = direction;
            keyboardState.isNavigating = true;
          });
        },

        selectCurrentItem: () => {
          set(state => {
            const { keyboardState, setlist } = state.state;
            const selectedSong = setlist.songs[keyboardState.focusedItemIndex];
            
            if (selectedSong) {
              state.state.selectedItemId = selectedSong.id;
              keyboardState.lastAction = 'select';
            }
          });
        },

        // Undo/Redo
        undo: () => {
          set(state => {
            const { undoRedoState } = state;
            
            if (undoRedoState.past.length > 0) {
              const previous = undoRedoState.past[undoRedoState.past.length - 1];
              const newPast = undoRedoState.past.slice(0, undoRedoState.past.length - 1);
              
              undoRedoState.future.unshift(undoRedoState.present);
              undoRedoState.present = previous;
              undoRedoState.past = newPast;
              undoRedoState.canUndo = newPast.length > 0;
              undoRedoState.canRedo = true;
              
              state.state.setlist = { ...previous };
            }
          });
          
          get().validateSetlist();
          get().recalculateTimeEstimation();
          get().refreshDuplicateDetection();
        },

        redo: () => {
          set(state => {
            const { undoRedoState } = state;
            
            if (undoRedoState.future.length > 0) {
              const next = undoRedoState.future[0];
              const newFuture = undoRedoState.future.slice(1);
              
              undoRedoState.past.push(undoRedoState.present);
              undoRedoState.present = next;
              undoRedoState.future = newFuture;
              undoRedoState.canUndo = true;
              undoRedoState.canRedo = newFuture.length > 0;
              
              state.state.setlist = { ...next };
            }
          });
          
          get().validateSetlist();
          get().recalculateTimeEstimation();
          get().refreshDuplicateDetection();
        },

        pushToHistory: () => {
          set(state => {
            const { undoRedoState } = state;
            const currentSetlist = { ...state.state.setlist };
            
            undoRedoState.past.push(undoRedoState.present);
            undoRedoState.present = currentSetlist;
            undoRedoState.future = []; // Clear future on new action
            undoRedoState.canUndo = true;
            undoRedoState.canRedo = false;
            
            // Limit history size to prevent memory issues
            if (undoRedoState.past.length > 50) {
              undoRedoState.past.shift();
            }
          });
        },

        clearHistory: () => {
          set(state => {
            state.undoRedoState.past = [];
            state.undoRedoState.future = [];
            state.undoRedoState.canUndo = false;
            state.undoRedoState.canRedo = false;
          });
        },

        // UI state
        setUIState: (uiState) => {
          set(state => {
            Object.assign(state.state, uiState);
          });
        },

        // Validation and calculations
        validateSetlist: () => {
          set(state => {
            const validation = validateSetlist(state.state.setlist);
            state.state.validation = validation;
          });
        },

        recalculateTimeEstimation: () => {
          set(state => {
            const timeEstimation = calculateTimeEstimation(state.state.setlist.songs);
            state.state.timeEstimation = timeEstimation;
            state.state.setlist.estimatedDuration = timeEstimation.totalMinutes;
          });
        },

        refreshDuplicateDetection: () => {
          set(state => {
            const duplicates = detectDuplicates(state.state.setlist.songs);
            state.state.duplicates = duplicates;
          });
        },

        // Configuration
        updateConfig: (configUpdates) => {
          set(state => {
            Object.assign(state.config, configUpdates);
          });
        },

        // Error handling
        setError: (error) => {
          set(state => {
            state.error = error;
          });
        },

        clearError: () => {
          set(state => {
            state.error = null;
          });
        }
      }))
    ),
    {
      name: 'setlist-store'
    }
  )
);

// Selector hooks for optimized subscriptions
export const useSetlist = () => useSetlistStore(state => state.state.setlist);
export const useSetlistValidation = () => useSetlistStore(state => state.state.validation);
export const useSetlistDragState = () => useSetlistStore(state => state.state.dragState);
export const useSetlistTouchState = () => useSetlistStore(state => state.state.touchState);
export const useSetlistKeyboardState = () => useSetlistStore(state => state.state.keyboardState);
export const useSetlistCanUndo = () => useSetlistStore(state => state.undoRedoState.canUndo);
export const useSetlistCanRedo = () => useSetlistStore(state => state.undoRedoState.canRedo);
export const useSetlistUndo = () => useSetlistStore(state => state.undo);
export const useSetlistRedo = () => useSetlistStore(state => state.redo);
export const useSetlistTimeEstimation = () => useSetlistStore(state => state.state.timeEstimation);
export const useSetlistDuplicates = () => useSetlistStore(state => state.state.duplicates);
export const useSetlistError = () => useSetlistStore(state => state.error);