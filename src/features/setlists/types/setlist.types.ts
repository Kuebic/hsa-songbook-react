/**
 * @file src/features/setlists/types/setlist.types.ts
 * @description Frontend TypeScript types for setlist management with drag-drop support
 */

// Core setlist item interface for frontend operations
export interface SetlistItem {
  id: string; // Unique identifier for React keys and drag-drop
  songId: string;
  arrangementId?: string;
  transpose: number; // Semitones to transpose (-11 to +11)
  notes?: string; // Performance notes for this song
  order: number;
  
  // Optional cached data for offline viewing
  songTitle?: string;
  songArtist?: string;
  originalKey?: string;
  tempo?: number;
  estimatedDuration?: number; // in seconds
}

// Main setlist interface for frontend state
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songs: SetlistItem[];
  tags: string[];
  
  // Metadata
  isPublic: boolean;
  shareToken?: string;
  estimatedDuration?: number; // in minutes
  
  // Usage tracking
  lastUsedAt?: Date;
  usageCount: number;
  
  // Server relationship
  serverId?: string;
  serverVersion?: number;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  
  // Local state
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  hasUnsavedChanges: boolean;
}

// Drag and drop related types
export interface DragDropResult {
  sourceIndex: number;
  destinationIndex: number;
  songId: string;
}

export interface SetlistDragState {
  isDragging: boolean;
  draggedItemId?: string;
  dragOverItemId?: string;
  dropIndicatorPosition?: 'top' | 'bottom' | 'center';
}

// Setlist operations for CRUD actions
export interface SetlistOperation {
  type: 'add_song' | 'remove_song' | 'reorder_songs' | 'update_song' | 'update_setlist';
  timestamp: number;
  data: any;
  optimistic?: boolean; // For optimistic updates
}

// Undo/Redo state
export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
  canUndo: boolean;
  canRedo: boolean;
}

// Song search/add interface
export interface AddSongToSetlistParams {
  songId: string;
  arrangementId?: string;
  insertAtIndex?: number; // If not provided, adds to end
  transpose?: number;
  notes?: string;
}

// Setlist validation interface
export interface SetlistValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    type: 'duplicate_song' | 'long_duration' | 'missing_arrangements';
    message: string;
    affectedItems?: string[]; // Song IDs
  }>;
}

// Time estimation interface
export interface TimeEstimation {
  totalMinutes: number;
  totalSeconds: number;
  formatted: string; // "1h 23m" format
  breakdown: Array<{
    songId: string;
    songTitle: string;
    estimatedMinutes: number;
    confidence: 'high' | 'medium' | 'low'; // Based on available tempo data
  }>;
}

// Duplicate detection
export interface DuplicateInfo {
  songId: string;
  songTitle: string;
  occurrences: Array<{
    itemId: string;
    order: number;
    arrangementId?: string;
    transpose: number;
  }>;
  suggestedAction: 'merge' | 'keep_separate' | 'remove_duplicates';
}

// Setlist sharing/export
export interface SetlistShareOptions {
  isPublic: boolean;
  allowEditing: boolean;
  expiresAt?: Date;
  password?: string;
  includeNotes: boolean;
  includeTranspositions: boolean;
}

export interface SetlistExportData {
  format: 'json' | 'txt' | 'pdf' | 'csv';
  data: string | Blob;
  filename: string;
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    includeNotes: boolean;
    includeTranspositions: boolean;
  };
}

// Touch/mobile specific types
export interface TouchDragState {
  isActive: boolean;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  draggedElement?: HTMLElement;
  hapticFeedback: boolean;
}

// Keyboard navigation state
export interface KeyboardNavigationState {
  focusedItemIndex: number;
  isNavigating: boolean;
  lastAction: 'up' | 'down' | 'select' | 'none';
}

// Setlist builder UI state
export interface SetlistBuilderState {
  setlist: Setlist;
  dragState: SetlistDragState;
  touchState: TouchDragState;
  keyboardState: KeyboardNavigationState;
  validation: SetlistValidation;
  timeEstimation: TimeEstimation;
  duplicates: DuplicateInfo[];
  
  // UI flags
  isLoading: boolean;
  isSaving: boolean;
  showDuplicateWarnings: boolean;
  showTimeEstimation: boolean;
  compactView: boolean;
  
  // Mobile UI
  showMobileControls: boolean;
  mobileBottomSheetOpen: boolean;
  selectedItemId?: string;
}

// API response types aligned with server models
export interface CreateSetlistRequest {
  name: string;
  description?: string;
  songs?: Array<{
    songId: string;
    arrangementId?: string;
    transpose?: number;
    notes?: string;
  }>;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateSetlistRequest extends Partial<CreateSetlistRequest> {
  id: string;
}

export interface ReorderSongsRequest {
  setlistId: string;
  newOrder: Array<{
    songId: string;
    order: number;
  }>;
}

// Error types specific to setlist operations
export interface SetlistError {
  code: 'DUPLICATE_SONG' | 'INVALID_SONG' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

// Performance monitoring
export interface SetlistPerformanceMetrics {
  dragLatency: number; // ms
  renderTime: number; // ms
  saveLatency: number; // ms
  listSize: number; // number of songs
  virtualizationEnabled: boolean;
}

// Configuration for setlist builder behavior
export interface SetlistBuilderConfig {
  maxSongs: number;
  autoSaveDelay: number; // ms
  dragThreshold: number; // px
  touchDragDelay: number; // ms
  keyboardScrollSpeed: number;
  enableHapticFeedback: boolean;
  enableAnimations: boolean;
  enableVirtualization: boolean;
  virtualizationThreshold: number; // number of items
}