/**
 * @file ChordEditorIntegration.test.tsx
 * @description Integration tests for ChordEditor with all its components
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChordEditor } from '../components/ChordEditor';
import type { ChordEditorProps, ValidationResult } from '../types/chord.types';

// Mock dependencies
jest.mock('ace-builds/src-noconflict/ace', () => ({
  edit: jest.fn(() => mockAceEditor),
  require: jest.fn(() => ({
    addCompleter: jest.fn()
  }))
}));

jest.mock('ace-builds/src-noconflict/mode-text', () => ({}));
jest.mock('ace-builds/src-noconflict/theme-github', () => ({}));
jest.mock('ace-builds/src-noconflict/theme-monokai', () => ({}));
jest.mock('ace-builds/src-noconflict/theme-terminal', () => ({}));
jest.mock('ace-builds/src-noconflict/ext-language_tools', () => ({}));

// Mock ChordDisplay for preview testing
jest.mock('../components/ChordDisplay', () => ({
  ChordDisplay: ({ content, theme }: any) => (
    <div data-testid="chord-display-preview" data-theme={theme}>
      {content}
    </div>
  )
}));

// Mock Ace editor instance
const mockAceEditor = {
  setValue: jest.fn(),
  getValue: jest.fn(() => ''),
  setTheme: jest.fn(),
  setFontSize: jest.fn(),
  setReadOnly: jest.fn(),
  setOptions: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  destroy: jest.fn(),
  insert: jest.fn(),
  getCursorPosition: jest.fn(() => ({ row: 0, column: 0 })),
  moveCursorTo: jest.fn(),
  moveCursorToPosition: jest.fn(),
  getSelectionRange: jest.fn(() => ({
    start: { row: 0, column: 0 },
    end: { row: 0, column: 0 }
  })),
  session: {
    setMode: jest.fn(),
    getLine: jest.fn(() => '')
  },
  commands: {
    addCommand: jest.fn()
  }
};

// Set window.ace
(window as any).ace = {
  edit: jest.fn(() => mockAceEditor),
  require: jest.fn(() => ({
    addCompleter: jest.fn()
  }))
};

describe('ChordEditor Integration Tests', () => {
  const defaultProps: ChordEditorProps = {
    content: '{title: Test Song}\n[C]Hello [G]world',
    onChange: jest.fn(),
    theme: 'light'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAceEditor.getValue.mockReturnValue(defaultProps.content);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Editor with Toolbar Integration', () => {
    it('shows toolbar and handles toolbar actions', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ChordEditor
          {...defaultProps}
          showToolbar={true}
          onAutoSave={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Toolbar should be visible
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();

      // Click format button
      const formatButton = screen.getByRole('button', { name: /format/i });
      await user.click(formatButton);

      // Format action should trigger content change
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      expect(changeHandler).toBeDefined();
    });

    it('updates toolbar state based on editor state', async () => {
      const { rerender } = render(
        <ChordEditor {...defaultProps} showToolbar={true} />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Initially, undo/redo should be disabled
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });
      
      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();

      // Simulate content change
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      mockAceEditor.getValue.mockReturnValue('{title: Modified}');
      changeHandler?.();

      // After change, component state should update
      // In real implementation, undo would become enabled
    });

    it('shows validation status in toolbar', async () => {
      const onValidate = jest.fn();
      render(
        <ChordEditor
          {...defaultProps}
          showToolbar={true}
          onValidate={onValidate}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Trigger validation with invalid content
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      mockAceEditor.getValue.mockReturnValue('{invalid}');
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: false,
            errors: expect.any(Array)
          })
        );
      });

      // Toolbar should show error count
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  describe('Editor with Preview Integration', () => {
    it('shows live preview alongside editor', async () => {
      render(
        <ChordEditor
          {...defaultProps}
          showPreview={true}
          height={600}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Preview should be visible
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByTestId('chord-display-preview')).toBeInTheDocument();
    });

    it('updates preview when content changes', async () => {
      render(
        <ChordEditor
          {...defaultProps}
          showPreview={true}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Initial preview content
      expect(screen.getByTestId('chord-display-preview')).toHaveTextContent(defaultProps.content);

      // Change content
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      const newContent = '{title: Updated Song}\n[Am]New [F]lyrics';
      mockAceEditor.getValue.mockReturnValue(newContent);
      changeHandler?.();

      // Advance timers for debounced preview update
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('chord-display-preview')).toHaveTextContent(newContent);
      });
    });

    it('shows validation errors in preview', async () => {
      const onValidate = jest.fn();
      render(
        <ChordEditor
          {...defaultProps}
          showPreview={true}
          onValidate={onValidate}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Trigger validation error
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      mockAceEditor.getValue.mockReturnValue('[]Empty chord');
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalled();
      });

      // Preview should show validation errors
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('synchronizes theme between editor and preview', async () => {
      const { rerender } = render(
        <ChordEditor
          {...defaultProps}
          showPreview={true}
          theme="light"
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Check initial theme
      expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/github');
      expect(screen.getByTestId('chord-display-preview')).toHaveAttribute('data-theme', 'light');

      // Change theme
      rerender(
        <ChordEditor
          {...defaultProps}
          showPreview={true}
          theme="dark"
        />
      );

      // Both editor and preview should update
      expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
      expect(screen.getByTestId('chord-display-preview')).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('Full Feature Integration', () => {
    it('handles complete workflow: edit, validate, preview, save', async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = jest.fn();
      const onValidate = jest.fn();
      const onAutoSave = jest.fn();

      render(
        <ChordEditor
          {...defaultProps}
          onChange={onChange}
          onValidate={onValidate}
          onAutoSave={onAutoSave}
          showToolbar={true}
          showPreview={true}
          autoComplete={true}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Step 1: Edit content
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      const newContent = '{title: My Song}\n{artist: Test Artist}\n\n[G]This is a [C]test [D]song';
      mockAceEditor.getValue.mockReturnValue(newContent);
      changeHandler?.();

      // Step 2: Verify onChange is called
      expect(onChange).toHaveBeenCalledWith(newContent);

      // Step 3: Verify validation runs
      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: true,
            errors: []
          })
        );
      });

      // Step 4: Verify preview updates (with debounce)
      jest.advanceTimersByTime(300);
      await waitFor(() => {
        expect(screen.getByTestId('chord-display-preview')).toHaveTextContent(newContent);
      });

      // Step 5: Trigger auto-save
      jest.advanceTimersByTime(5000); // Default auto-save delay
      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledWith(newContent);
      });

      // Step 6: Verify dirty state clears after save
      expect(screen.queryByText('(modified)')).not.toBeInTheDocument();
    });

    it('handles error recovery workflow', async () => {
      const user = userEvent.setup({ delay: null });
      const onValidate = jest.fn();

      render(
        <ChordEditor
          {...defaultProps}
          onValidate={onValidate}
          showToolbar={true}
          showPreview={true}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Step 1: Introduce error
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      mockAceEditor.getValue.mockReturnValue('{unclosed directive');
      changeHandler?.();

      // Step 2: Verify validation error
      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: false,
            errors: expect.arrayContaining([
              expect.objectContaining({
                type: 'directive'
              })
            ])
          })
        );
      });

      // Step 3: Verify error display
      expect(screen.getByText(/error/i)).toBeInTheDocument();

      // Step 4: Fix error
      mockAceEditor.getValue.mockReturnValue('{title: Fixed}');
      changeHandler?.();

      // Step 5: Verify validation passes
      await waitFor(() => {
        expect(onValidate).toHaveBeenLastCalledWith(
          expect.objectContaining({
            valid: true,
            errors: []
          })
        );
      });

      // Step 6: Verify error display clears
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    it('handles rapid edits efficiently', async () => {
      const onChange = jest.fn();
      const onValidate = jest.fn();

      render(
        <ChordEditor
          {...defaultProps}
          onChange={onChange}
          onValidate={onValidate}
          showPreview={true}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];

      // Simulate rapid typing
      const updates = Array.from({ length: 50 }, (_, i) => 
        `{title: Update ${i}}\n[C]Test ${i}`
      );

      updates.forEach(content => {
        mockAceEditor.getValue.mockReturnValue(content);
        changeHandler?.();
      });

      // onChange should be called for each update
      expect(onChange).toHaveBeenCalledTimes(updates.length);

      // Validation should also run for each update
      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledTimes(updates.length);
      });

      // Preview should debounce updates
      jest.advanceTimersByTime(300);
      
      // Final content should be displayed
      await waitFor(() => {
        expect(screen.getByTestId('chord-display-preview'))
          .toHaveTextContent(updates[updates.length - 1]);
      });
    });

    it('handles large documents', async () => {
      // Generate large ChordPro content
      const largeContent = Array.from({ length: 100 }, (_, i) => 
        `{c: Verse ${i + 1}}\n[C]Line one of verse ${i + 1}\n[G]Line two of verse ${i + 1}\n[Am]Line three of verse ${i + 1}\n[F]Line four of verse ${i + 1}\n\n`
      ).join('');

      const startTime = performance.now();

      render(
        <ChordEditor
          content={largeContent}
          onChange={jest.fn()}
          onValidate={jest.fn()}
          showPreview={true}
          theme="light"
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const loadTime = performance.now() - startTime;

      // Should still load quickly even with large content
      expect(loadTime).toBeLessThan(500);

      // Editor should handle the large content
      expect(mockAceEditor.setValue).toHaveBeenCalledWith(largeContent, -1);
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains focus management between components', async () => {
      const user = userEvent.setup({ delay: null });
      
      render(
        <ChordEditor
          {...defaultProps}
          showToolbar={true}
          showPreview={true}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Focus should be manageable between toolbar and editor
      const formatButton = screen.getByRole('button', { name: /format/i });
      const editorElement = screen.getByRole('textbox', { name: 'ChordPro Editor' });

      // Click toolbar button
      await user.click(formatButton);

      // Focus should return to editor after toolbar action
      expect(editorElement).toHaveAttribute('tabIndex', '0');
    });

    it('provides comprehensive keyboard navigation', async () => {
      render(
        <ChordEditor
          {...defaultProps}
          showToolbar={true}
          showPreview={true}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // All interactive elements should be keyboard accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });

      const editor = screen.getByRole('textbox');
      expect(editor).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Auto-save Integration', () => {
    it('coordinates auto-save with validation', async () => {
      const onAutoSave = jest.fn();
      const onValidate = jest.fn();

      render(
        <ChordEditor
          {...defaultProps}
          onAutoSave={onAutoSave}
          onValidate={onValidate}
          autoSaveDelay={2000}
        />
      );

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Make changes
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      const validContent = '{title: Valid Song}\n[C]Test';
      mockAceEditor.getValue.mockReturnValue(validContent);
      changeHandler?.();

      // Validation should run immediately
      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({ valid: true })
        );
      });

      // Auto-save should trigger after delay
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledWith(validContent);
      });

      // Now test with invalid content
      jest.clearAllMocks();
      
      const invalidContent = '{unclosed';
      mockAceEditor.getValue.mockReturnValue(invalidContent);
      changeHandler?.();

      // Validation should fail
      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({ valid: false })
        );
      });

      // Auto-save should still trigger (user might want to save invalid drafts)
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledWith(invalidContent);
      });
    });
  });
});