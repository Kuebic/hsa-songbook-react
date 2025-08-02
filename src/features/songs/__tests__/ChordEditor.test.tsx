/**
 * @file ChordEditor.test.tsx
 * @description Comprehensive test suite for ChordEditor component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChordEditor } from '../components/ChordEditor';
import type { ChordEditorProps, ValidationResult } from '../types/chord.types';

// Mock dependencies
vi.mock('ace-builds/src-noconflict/ace', () => ({
  edit: vi.fn(() => mockAceEditor),
  require: vi.fn(() => ({
    addCompleter: vi.fn()
  }))
}));

vi.mock('ace-builds/src-noconflict/mode-text', () => ({}));
vi.mock('ace-builds/src-noconflict/theme-github', () => ({}));
vi.mock('ace-builds/src-noconflict/theme-monokai', () => ({}));
vi.mock('ace-builds/src-noconflict/theme-terminal', () => ({}));
vi.mock('ace-builds/src-noconflict/ext-language_tools', () => ({}));

// Mock Ace editor instance
const mockAceEditor = {
  setValue: vi.fn(),
  getValue: vi.fn(() => ''),
  setTheme: vi.fn(),
  setFontSize: vi.fn(),
  setReadOnly: vi.fn(),
  setOptions: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
  insert: vi.fn(),
  getCursorPosition: vi.fn(() => ({ row: 0, column: 0 })),
  moveCursorTo: vi.fn(),
  moveCursorToPosition: vi.fn(),
  getSelectionRange: vi.fn(() => ({
    start: { row: 0, column: 0 },
    end: { row: 0, column: 0 }
  })),
  session: {
    setMode: vi.fn(),
    getLine: vi.fn(() => '')
  },
  commands: {
    addCommand: vi.fn()
  }
};

// Set window.ace
(window as any).ace = {
  edit: vi.fn(() => mockAceEditor),
  require: vi.fn(() => ({
    addCompleter: vi.fn()
  }))
};

describe('ChordEditor', () => {
  const defaultProps: ChordEditorProps = {
    content: '{title: Test Song}\n[C]Hello [G]world',
    onChange: vi.fn(),
    theme: 'light'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockAceEditor.getValue.mockReturnValue(defaultProps.content);
  });

  describe('Validation', () => {
    it('validates ChordPro syntax on change', async () => {
      const onValidate = jest.fn();
      const { rerender } = render(
        <ChordEditor {...defaultProps} onValidate={onValidate} />
      );

      // Wait for editor initialization
      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Simulate content change
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      mockAceEditor.getValue.mockReturnValue('{title: Test Song}');
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: true,
            errors: []
          })
        );
      });
    });

    it('reports validation errors for invalid syntax', async () => {
      const onValidate = jest.fn();
      render(<ChordEditor {...defaultProps} onValidate={onValidate} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Simulate invalid content
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      mockAceEditor.getValue.mockReturnValue('{invalid directive}');
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: false,
            errors: expect.arrayContaining([
              expect.objectContaining({
                type: 'directive',
                message: expect.stringContaining("Unknown directive")
              })
            ])
          })
        );
      });
    });

    it('validates chord symbols', async () => {
      const onValidate = jest.fn();
      render(<ChordEditor {...defaultProps} onValidate={onValidate} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      // Test invalid chord
      mockAceEditor.getValue.mockReturnValue('[InvalidChord]Hello');
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: false,
            errors: expect.arrayContaining([
              expect.objectContaining({
                type: 'chord',
                message: expect.stringContaining('Invalid chord symbol')
              })
            ])
          })
        );
      });
    });

    it('provides helpful validation suggestions', async () => {
      const onValidate = jest.fn();
      render(<ChordEditor {...defaultProps} onValidate={onValidate} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      // Empty chord bracket
      mockAceEditor.getValue.mockReturnValue('[]Hello');
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            errors: expect.arrayContaining([
              expect.objectContaining({
                suggestion: 'Remove empty brackets or add a chord symbol'
              })
            ])
          })
        );
      });
    });

    it('tracks validation performance', async () => {
      const onValidate = jest.fn();
      render(<ChordEditor {...defaultProps} onValidate={onValidate} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalledWith(
          expect.objectContaining({
            parseTime: expect.any(Number)
          })
        );
      });
    });
  });

  describe('Editor Initialization', () => {
    it('loads editor in less than 200ms', async () => {
      const startTime = performance.now();
      
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(200);
    });

    it('applies initial content', async () => {
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(mockAceEditor.setValue).toHaveBeenCalledWith(
          defaultProps.content,
          -1
        );
      });
    });

    it('configures editor with correct options', async () => {
      render(
        <ChordEditor
          {...defaultProps}
          autoComplete={true}
          readOnly={false}
          placeholder="Custom placeholder"
        />
      );

      await waitFor(() => {
        expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            placeholder: 'Custom placeholder',
            showLineNumbers: true,
            wrap: true
          })
        );
      });
    });

    it('sets up event handlers', async () => {
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(mockAceEditor.on).toHaveBeenCalledWith('change', expect.any(Function));
        expect(mockAceEditor.on).toHaveBeenCalledWith('changeSelection', expect.any(Function));
      });
    });
  });

  describe('Syntax Highlighting', () => {
    it('applies correct theme based on prop', async () => {
      const { rerender } = render(<ChordEditor {...defaultProps} theme="light" />);

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/github');
      });

      rerender(<ChordEditor {...defaultProps} theme="dark" />);

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
      });

      rerender(<ChordEditor {...defaultProps} theme="stage" />);

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/terminal');
      });
    });

    it('sets correct font size', async () => {
      render(<ChordEditor {...defaultProps} fontSize={18} />);

      await waitFor(() => {
        expect(mockAceEditor.setFontSize).toHaveBeenCalledWith('18px');
      });
    });

    it('updates theme dynamically', async () => {
      const { rerender } = render(<ChordEditor {...defaultProps} theme="light" />);

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/github');
      });

      jest.clearAllMocks();

      rerender(<ChordEditor {...defaultProps} theme="dark" />);

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
      });
    });
  });

  describe('Auto-completion', () => {
    it('enables auto-completion when prop is true', async () => {
      render(<ChordEditor {...defaultProps} autoComplete={true} />);

      await waitFor(() => {
        expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
          })
        );
      });

      // Verify completers are added
      expect(window.ace.require).toHaveBeenCalledWith('ace/ext/language_tools');
    });

    it('disables auto-completion when prop is false', async () => {
      render(<ChordEditor {...defaultProps} autoComplete={false} />);

      await waitFor(() => {
        expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            enableBasicAutocompletion: false,
            enableLiveAutocompletion: false
          })
        );
      });
    });
  });

  describe('Content Updates', () => {
    it('calls onChange when content changes', async () => {
      const onChange = jest.fn();
      render(<ChordEditor {...defaultProps} onChange={onChange} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      const newContent = '{title: Updated Song}';
      mockAceEditor.getValue.mockReturnValue(newContent);
      changeHandler?.();

      expect(onChange).toHaveBeenCalledWith(newContent);
    });

    it('updates cursor position on selection change', async () => {
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      const selectionHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'changeSelection'
      )?.[1];
      
      mockAceEditor.getSelectionRange.mockReturnValue({
        start: { row: 2, column: 5 },
        end: { row: 2, column: 10 }
      });
      
      selectionHandler?.();

      // Verify cursor position is tracked (internal state)
      expect(mockAceEditor.getSelectionRange).toHaveBeenCalled();
    });
  });

  describe('Read-only Mode', () => {
    it('sets read-only mode correctly', async () => {
      render(<ChordEditor {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(mockAceEditor.setReadOnly).toHaveBeenCalledWith(true);
      });
    });

    it('updates read-only mode dynamically', async () => {
      const { rerender } = render(<ChordEditor {...defaultProps} readOnly={false} />);

      await waitFor(() => {
        expect(mockAceEditor.setReadOnly).toHaveBeenCalledWith(false);
      });

      jest.clearAllMocks();

      rerender(<ChordEditor {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(mockAceEditor.setReadOnly).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Editor Cleanup', () => {
    it('destroys editor on unmount', async () => {
      const { unmount } = render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      unmount();

      expect(mockAceEditor.destroy).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('memoizes component to prevent unnecessary re-renders', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <ChordEditor {...defaultProps} onChange={onChange} />
      );

      const initialCallCount = window.ace.edit.mock.calls.length;

      // Re-render with same props
      rerender(<ChordEditor {...defaultProps} onChange={onChange} />);

      // Editor should not be re-initialized
      expect(window.ace.edit).toHaveBeenCalledTimes(initialCallCount);
    });

    it('clamps font size to valid range', async () => {
      // Test with font size too small
      render(<ChordEditor {...defaultProps} fontSize={8} />);

      await waitFor(() => {
        expect(mockAceEditor.setFontSize).toHaveBeenCalledWith('12px'); // MIN_FONT_SIZE
      });

      jest.clearAllMocks();

      // Test with font size too large
      render(<ChordEditor {...defaultProps} fontSize={100} />);

      await waitFor(() => {
        expect(mockAceEditor.setFontSize).toHaveBeenCalledWith('32px'); // MAX_FONT_SIZE
      });
    });

    it('clamps height to valid range', () => {
      const { container } = render(
        <ChordEditor {...defaultProps} height={50} /> // Too small
      );

      const editorDiv = container.querySelector('.chord-editor');
      expect(editorDiv).toHaveStyle('height: 200px'); // MIN_HEIGHT
    });
  });

  describe('Status Bar', () => {
    it('displays current cursor position', async () => {
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Line 1, Column 1/)).toBeInTheDocument();
      });
    });

    it('displays character count', async () => {
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        const charCount = defaultProps.content.length;
        expect(screen.getByText(new RegExp(`${charCount} characters`))).toBeInTheDocument();
      });
    });

    it('displays validation time when available', async () => {
      const onValidate = jest.fn();
      render(<ChordEditor {...defaultProps} onValidate={onValidate} />);

      await waitFor(() => {
        expect(window.ace.edit).toHaveBeenCalled();
      });

      // Trigger validation
      const changeHandler = mockAceEditor.on.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      changeHandler?.();

      await waitFor(() => {
        expect(onValidate).toHaveBeenCalled();
      });

      // Status bar should show validation time
      await waitFor(() => {
        expect(screen.getByText(/Validated in \d+\.\d+ms/)).toBeInTheDocument();
      });
    });
  });

  describe('Placeholder', () => {
    it('shows custom placeholder text', async () => {
      const customPlaceholder = 'Enter your song here...';
      render(
        <ChordEditor {...defaultProps} placeholder={customPlaceholder} />
      );

      await waitFor(() => {
        expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            placeholder: customPlaceholder
          })
        );
      });
    });

    it('shows default placeholder when not provided', async () => {
      render(<ChordEditor {...defaultProps} />);

      await waitFor(() => {
        expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            placeholder: 'Start typing your ChordPro song...'
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ChordEditor {...defaultProps} />);

      const editor = screen.getByRole('textbox', { name: 'ChordPro Editor' });
      expect(editor).toHaveAttribute('aria-multiline', 'true');
      expect(editor).toHaveAttribute('tabIndex', '0');
    });

    it('applies custom className', () => {
      const { container } = render(
        <ChordEditor {...defaultProps} className="custom-editor-class" />
      );

      const editor = container.querySelector('.chord-editor');
      expect(editor).toHaveClass('custom-editor-class');
    });
  });
});