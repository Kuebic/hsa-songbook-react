/**
 * @file ChordEditorToolbar.test.tsx
 * @description Test suite for ChordEditorToolbar component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChordEditorToolbar } from '../components/ChordEditorToolbar';
import type { ChordEditorToolbarProps, ValidationResult } from '../types/chord.types';

describe('ChordEditorToolbar', () => {
  const defaultProps: ChordEditorToolbarProps = {
    onAction: jest.fn(),
    theme: 'light'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default Actions', () => {
    it('renders all default toolbar buttons', () => {
      render(<ChordEditorToolbar {...defaultProps} />);

      // Check for default buttons
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /insert chord/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /insert directive/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
    });

    it('handles undo action', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} canUndo={true} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('undo');
    });

    it('handles redo action', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} canRedo={true} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      await user.click(redoButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('redo');
    });

    it('handles insert chord action', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} />);

      const insertChordButton = screen.getByRole('button', { name: /insert chord/i });
      await user.click(insertChordButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('insert-chord');
    });

    it('handles insert directive action', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} />);

      const insertDirectiveButton = screen.getByRole('button', { name: /insert directive/i });
      await user.click(insertDirectiveButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('insert-directive');
    });

    it('handles format action', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} />);

      const formatButton = screen.getByRole('button', { name: /format/i });
      await user.click(formatButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('format');
    });
  });

  describe('Button States', () => {
    it('disables undo button when canUndo is false', () => {
      render(<ChordEditorToolbar {...defaultProps} canUndo={false} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('enables undo button when canUndo is true', () => {
      render(<ChordEditorToolbar {...defaultProps} canUndo={true} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
    });

    it('disables redo button when canRedo is false', () => {
      render(<ChordEditorToolbar {...defaultProps} canRedo={false} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toBeDisabled();
    });

    it('enables redo button when canRedo is true', () => {
      render(<ChordEditorToolbar {...defaultProps} canRedo={true} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();
    });
  });

  describe('Save Button', () => {
    it('shows save button when showSave is true', () => {
      render(<ChordEditorToolbar {...defaultProps} showSave={true} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('hides save button when showSave is false', () => {
      render(<ChordEditorToolbar {...defaultProps} showSave={false} />);

      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });

    it('handles save action', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} showSave={true} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('save');
    });

    it('shows dirty indicator when content is modified', () => {
      render(<ChordEditorToolbar {...defaultProps} isDirty={true} showSave={true} />);

      // Should show modified indicator
      expect(screen.getByText('(modified)')).toBeInTheDocument();
    });

    it('hides dirty indicator when content is saved', () => {
      render(<ChordEditorToolbar {...defaultProps} isDirty={false} showSave={true} />);

      // Should not show modified indicator
      expect(screen.queryByText('(modified)')).not.toBeInTheDocument();
    });
  });

  describe('Validation Status', () => {
    it('shows validation success when no errors', () => {
      const validation: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        parseTime: 5.2
      };

      render(
        <ChordEditorToolbar
          {...defaultProps}
          validation={validation}
          showValidation={true}
        />
      );

      expect(screen.getByText('✓ Valid')).toBeInTheDocument();
      expect(screen.getByText('✓ Valid')).toHaveClass('text-green-600');
    });

    it('shows error count when validation fails', () => {
      const validation: ValidationResult = {
        valid: false,
        errors: [
          { line: 1, column: 1, message: 'Error 1', type: 'syntax' },
          { line: 2, column: 1, message: 'Error 2', type: 'chord' }
        ],
        warnings: []
      };

      render(
        <ChordEditorToolbar
          {...defaultProps}
          validation={validation}
          showValidation={true}
        />
      );

      expect(screen.getByText('✗ 2 errors')).toBeInTheDocument();
      expect(screen.getByText('✗ 2 errors')).toHaveClass('text-red-600');
    });

    it('shows warning count when present', () => {
      const validation: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [
          { line: 1, message: 'Warning 1', type: 'style' },
          { line: 2, message: 'Warning 2', type: 'style' },
          { line: 3, message: 'Warning 3', type: 'style' }
        ]
      };

      render(
        <ChordEditorToolbar
          {...defaultProps}
          validation={validation}
          showValidation={true}
        />
      );

      expect(screen.getByText('⚠ 3 warnings')).toBeInTheDocument();
      expect(screen.getByText('⚠ 3 warnings')).toHaveClass('text-yellow-600');
    });

    it('hides validation status when showValidation is false', () => {
      const validation: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
      };

      render(
        <ChordEditorToolbar
          {...defaultProps}
          validation={validation}
          showValidation={false}
        />
      );

      expect(screen.queryByText('✓ Valid')).not.toBeInTheDocument();
    });
  });

  describe('Custom Actions', () => {
    it('renders custom toolbar actions', () => {
      const customActions = [
        {
          id: 'custom-1',
          label: 'Custom Action 1',
          icon: '⭐',
          tooltip: 'Custom tooltip 1',
          type: 'button' as const
        },
        {
          id: 'custom-2',
          label: 'Custom Action 2',
          icon: '🎵',
          tooltip: 'Custom tooltip 2',
          type: 'button' as const
        }
      ];

      render(
        <ChordEditorToolbar
          {...defaultProps}
          customActions={customActions}
        />
      );

      expect(screen.getByRole('button', { name: /custom action 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom action 2/i })).toBeInTheDocument();
    });

    it('handles custom action clicks', async () => {
      const user = userEvent.setup();
      const customActions = [
        {
          id: 'transpose-up',
          label: 'Transpose Up',
          icon: '♯',
          tooltip: 'Transpose up one semitone',
          type: 'button' as const
        }
      ];

      render(
        <ChordEditorToolbar
          {...defaultProps}
          customActions={customActions}
        />
      );

      const customButton = screen.getByRole('button', { name: /transpose up/i });
      await user.click(customButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('transpose-up');
    });

    it('supports toggle type custom actions', async () => {
      const user = userEvent.setup();
      const customActions = [
        {
          id: 'show-chords',
          label: 'Show Chords',
          icon: '👁️',
          tooltip: 'Toggle chord visibility',
          type: 'toggle' as const,
          active: false
        }
      ];

      render(
        <ChordEditorToolbar
          {...defaultProps}
          customActions={customActions}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /show chords/i });
      await user.click(toggleButton);

      expect(defaultProps.onAction).toHaveBeenCalledWith('show-chords', true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('displays keyboard shortcuts in tooltips', async () => {
      const user = userEvent.setup();
      render(<ChordEditorToolbar {...defaultProps} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      
      // Hover to show tooltip
      await user.hover(undoButton);

      // Tooltip should contain shortcut
      expect(undoButton).toHaveAttribute('title', expect.stringContaining('Ctrl+Z'));
    });

    it('shows Mac shortcuts on Mac platform', () => {
      // Mock Mac platform
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true
      });

      render(<ChordEditorToolbar {...defaultProps} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveAttribute('title', expect.stringContaining('Cmd+Z'));

      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      });
    });
  });

  describe('Theme Support', () => {
    it('applies light theme styles', () => {
      const { container } = render(
        <ChordEditorToolbar {...defaultProps} theme="light" />
      );

      const toolbar = container.querySelector('.chord-editor-toolbar');
      expect(toolbar).toHaveClass('bg-gray-50', 'border-gray-200');
    });

    it('applies dark theme styles', () => {
      const { container } = render(
        <ChordEditorToolbar {...defaultProps} theme="dark" />
      );

      const toolbar = container.querySelector('.chord-editor-toolbar');
      expect(toolbar).toHaveClass('bg-gray-800', 'border-gray-700');
    });

    it('applies stage theme styles', () => {
      const { container } = render(
        <ChordEditorToolbar {...defaultProps} theme="stage" />
      );

      const toolbar = container.querySelector('.chord-editor-toolbar');
      expect(toolbar).toHaveClass('bg-black', 'border-gray-800');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<ChordEditorToolbar {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('applies custom className', () => {
      const { container } = render(
        <ChordEditorToolbar {...defaultProps} className="custom-toolbar" />
      );

      const toolbar = container.querySelector('.chord-editor-toolbar');
      expect(toolbar).toHaveClass('custom-toolbar');
    });

    it('groups buttons semantically', () => {
      const { container } = render(<ChordEditorToolbar {...defaultProps} />);

      // Should have button groups
      const groups = container.querySelectorAll('[role="group"]');
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('shows icon-only mode on small screens', () => {
      // Mock small viewport
      global.innerWidth = 400;
      global.dispatchEvent(new Event('resize'));

      render(<ChordEditorToolbar {...defaultProps} />);

      // Icons should be visible, labels should be hidden on small screens
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const icon = button.querySelector('.toolbar-icon');
        const label = button.querySelector('.toolbar-label');
        
        if (icon && label) {
          expect(icon).toBeVisible();
          // Note: CSS media queries aren't applied in jsdom, so we can't test actual hiding
        }
      });
    });
  });
});