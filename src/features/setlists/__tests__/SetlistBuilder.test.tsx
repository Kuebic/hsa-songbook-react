/**
 * @file src/features/setlists/__tests__/SetlistBuilder.test.tsx
 * @description Tests for SetlistBuilder component with drag-and-drop functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SetlistBuilder } from '../components/SetlistBuilder';
import { useSetlistStore } from '../stores';
import type { Setlist, SetlistItem } from '../types';

// Mock the @dnd-kit modules
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => (
    <div data-testid="dnd-context" onClick={() => onDragEnd?.({ active: { id: 'test' }, over: { id: 'test2' } })}>
      {children}
    </div>
  ),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  TouchSensor: jest.fn(),
  closestCenter: jest.fn(),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  defaultDropAnimationSideEffects: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  sortableKeyboardCoordinates: jest.fn(),
}));

jest.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: jest.fn(),
  restrictToWindowEdges: jest.fn(),
}));

// Mock the store
const mockSetlist: Setlist = {
  id: 'test-setlist',
  name: 'Test Setlist',
  description: 'A test setlist',
  songs: [
    {
      id: 'song1',
      songId: 'song1',
      songTitle: 'Amazing Grace',
      songArtist: 'Traditional',
      originalKey: 'G',
      transpose: 0,
      order: 0,
      notes: 'Start slow'
    },
    {
      id: 'song2',
      songId: 'song2',
      songTitle: 'How Great Thou Art',
      songArtist: 'Traditional',
      originalKey: 'A',
      transpose: -2,
      order: 1
    }
  ],
  tags: ['sunday'],
  isPublic: false,
  estimatedDuration: 25,
  usageCount: 1,
  createdBy: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  syncStatus: 'synced',
  hasUnsavedChanges: false
};

const mockUseSetlistStore = {
  state: {
    setlist: mockSetlist,
    dragState: { isDragging: false },
    validation: { isValid: true, errors: [], warnings: [] },
    timeEstimation: { totalMinutes: 25, totalSeconds: 1500, formatted: '25m', breakdown: [] },
    duplicates: []
  },
  undoRedoState: {
    canUndo: false,
    canRedo: false
  },
  error: null,
  reorderSongs: jest.fn(),
  setDragState: jest.fn(),
  resetDragState: jest.fn(),
  setUIState: jest.fn(),
  validateSetlist: jest.fn(),
  recalculateTimeEstimation: jest.fn(),
  refreshDuplicateDetection: jest.fn(),
  clearError: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn()
};

// Mock the individual hooks
jest.mock('../stores', () => ({
  useSetlistStore: () => mockUseSetlistStore,
  useSetlist: () => mockSetlist,
  useSetlistDragState: () => ({ isDragging: false }),
  useSetlistError: () => null,
  useSetlistCanUndo: () => false,
  useSetlistCanRedo: () => false,
  useSetlistUndo: () => jest.fn(),
  useSetlistRedo: () => jest.fn(),
  useSetlistValidation: () => ({ isValid: true, errors: [], warnings: [] }),
  useSetlistDuplicates: () => [],
  useSetlistTimeEstimation: () => ({ totalMinutes: 25, totalSeconds: 1500, formatted: '25m', breakdown: [] })
}));

describe('SetlistBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders setlist builder with correct structure', () => {
    render(<SetlistBuilder />);

    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(screen.getByLabelText('Setlist Builder')).toBeInTheDocument();
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('displays setlist information correctly', () => {
    render(<SetlistBuilder />);

    expect(screen.getByText('Test Setlist')).toBeInTheDocument();
    expect(screen.getByText('A test setlist')).toBeInTheDocument();
    expect(screen.getByText('2 songs')).toBeInTheDocument();
  });

  it('renders individual setlist items', () => {
    render(<SetlistBuilder />);

    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument();
    expect(screen.getByText('Traditional')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const mockOnSave = jest.fn();
    render(<SetlistBuilder onSave={mockOnSave} />);

    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(mockSetlist);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const mockOnCancel = jest.fn();
    render(<SetlistBuilder onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays read-only mode correctly', () => {
    render(<SetlistBuilder readOnly={true} />);

    // Save/Cancel buttons should not be present in read-only mode
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('handles drag and drop operations', async () => {
    render(<SetlistBuilder />);

    const dndContext = screen.getByTestId('dnd-context');
    fireEvent.click(dndContext);

    await waitFor(() => {
      expect(mockUseSetlistStore.reorderSongs).toHaveBeenCalled();
    });
  });

  it('shows compact mode when enabled', () => {
    const { container } = render(<SetlistBuilder compactMode={true} />);

    expect(container.firstChild).toHaveClass('compact-mode');
  });

  it('handles keyboard shortcuts', async () => {
    render(<SetlistBuilder />);

    // Focus on the setlist builder
    const setlistBuilder = screen.getByRole('application');
    setlistBuilder.focus();

    // Test Ctrl+S for save
    fireEvent.keyDown(document, {
      key: 's',
      ctrlKey: true,
      preventDefault: jest.fn()
    });

    // Test Ctrl+Z for undo
    fireEvent.keyDown(document, {
      key: 'z',
      ctrlKey: true,
      preventDefault: jest.fn()
    });

    await waitFor(() => {
      expect(mockUseSetlistStore.undo).toHaveBeenCalled();
    });
  });

  it('displays error messages when present', () => {
    const mockError = {
      code: 'VALIDATION_ERROR' as const,
      message: 'Test error message',
      recoverable: true,
      suggestedAction: 'Try again'
    };

    jest.mocked(useSetlistStore).mockReturnValue({
      ...mockUseSetlistStore,
      error: mockError
    });

    render(<SetlistBuilder />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('shows empty state when no songs', () => {
    const emptySetlist = { ...mockSetlist, songs: [] };
    
    jest.mocked(useSetlistStore).mockReturnValue({
      ...mockUseSetlistStore,
      state: {
        ...mockUseSetlistStore.state,
        setlist: emptySetlist
      }
    });

    render(<SetlistBuilder />);

    expect(screen.getByText('Start building your setlist')).toBeInTheDocument();
    expect(screen.getByText('Add first song')).toBeInTheDocument();
  });

  it('sets compact view in store on mount', () => {
    render(<SetlistBuilder compactMode={true} />);

    expect(mockUseSetlistStore.setUIState).toHaveBeenCalledWith({ compactView: true });
  });

  it('triggers validation and calculations on mount', () => {
    render(<SetlistBuilder />);

    expect(mockUseSetlistStore.validateSetlist).toHaveBeenCalled();
    expect(mockUseSetlistStore.recalculateTimeEstimation).toHaveBeenCalled();
    expect(mockUseSetlistStore.refreshDuplicateDetection).toHaveBeenCalled();
  });

  it('provides accessibility announcements for drag operations', () => {
    render(<SetlistBuilder />);

    // Check that the hidden instructions are present
    expect(screen.getByText(/Use drag and drop to reorder songs/)).toBeInTheDocument();
    expect(screen.getByText(/Press Ctrl\+S to save/)).toBeInTheDocument();
  });

  it('handles drag start with haptic feedback', () => {
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true
    });

    render(<SetlistBuilder />);

    const dndContext = screen.getByTestId('dnd-context');
    fireEvent.click(dndContext); // Simulates drag start

    expect(mockUseSetlistStore.setDragState).toHaveBeenCalledWith({
      isDragging: true,
      draggedItemId: 'test'
    });
  });

  describe('Drag operations', () => {
    it('handles drag start correctly', () => {
      render(<SetlistBuilder />);

      // The drag start is handled internally by the DndContext mock
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('handles drag end correctly', () => {
      render(<SetlistBuilder />);

      const dndContext = screen.getByTestId('dnd-context');
      fireEvent.click(dndContext);

      expect(mockUseSetlistStore.resetDragState).toHaveBeenCalled();
    });
  });

  describe('Integration with other components', () => {
    it('renders all sub-components', () => {
      render(<SetlistBuilder />);

      // Check that main components are rendered (they may have their own test ids)
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    it('applies custom className', () => {
      const { container } = render(<SetlistBuilder className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('passes readOnly prop correctly', () => {
      render(<SetlistBuilder readOnly={true} />);

      // In read-only mode, certain controls should not be present
      expect(screen.queryByText('Add first song')).not.toBeInTheDocument();
    });
  });
});