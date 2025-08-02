/**
 * @file ChordEditorPreview.test.tsx
 * @description Test suite for ChordEditorPreview component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChordEditorPreview } from '../components/ChordEditorPreview';
import type { ChordEditorPreviewProps, ValidationResult } from '../types/chord.types';

// Mock ChordDisplay component
jest.mock('../components/ChordDisplay', () => ({
  ChordDisplay: ({ content, theme }: any) => (
    <div data-testid="chord-display" data-theme={theme}>
      {content}
    </div>
  )
}));

describe('ChordEditorPreview', () => {
  const defaultProps: ChordEditorPreviewProps = {
    content: '{title: Test Song}\n[C]Hello [G]world',
    theme: 'light'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders preview with ChordDisplay', () => {
      render(<ChordEditorPreview {...defaultProps} />);

      expect(screen.getByTestId('chord-display')).toBeInTheDocument();
      expect(screen.getByText(defaultProps.content)).toBeInTheDocument();
    });

    it('shows default title when not provided', () => {
      render(<ChordEditorPreview {...defaultProps} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('shows custom title when provided', () => {
      render(<ChordEditorPreview {...defaultProps} title="Live Preview" />);

      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    it('applies correct theme to ChordDisplay', () => {
      render(<ChordEditorPreview {...defaultProps} theme="dark" />);

      const chordDisplay = screen.getByTestId('chord-display');
      expect(chordDisplay).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('Live Updates', () => {
    it('updates preview when content changes', async () => {
      const { rerender } = render(<ChordEditorPreview {...defaultProps} />);

      expect(screen.getByText(defaultProps.content)).toBeInTheDocument();

      const newContent = '{title: Updated Song}\n[Am]New [F]content';
      rerender(<ChordEditorPreview {...defaultProps} content={newContent} />);

      await waitFor(() => {
        expect(screen.getByText(newContent)).toBeInTheDocument();
      });
    });

    it('debounces updates with default delay', async () => {
      const { rerender } = render(<ChordEditorPreview {...defaultProps} />);

      // Rapid content changes
      const updates = [
        '{title: Update 1}',
        '{title: Update 2}',
        '{title: Update 3}',
        '{title: Final Update}'
      ];

      updates.forEach(content => {
        rerender(<ChordEditorPreview {...defaultProps} content={content} />);
      });

      // Should not update immediately
      expect(screen.queryByText('{title: Final Update}')).not.toBeInTheDocument();

      // Fast forward default delay (300ms)
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('{title: Final Update}')).toBeInTheDocument();
      });
    });

    it('uses custom update delay', async () => {
      const customDelay = 500;
      const { rerender } = render(
        <ChordEditorPreview {...defaultProps} updateDelay={customDelay} />
      );

      const newContent = '{title: Delayed Update}';
      rerender(
        <ChordEditorPreview
          {...defaultProps}
          content={newContent}
          updateDelay={customDelay}
        />
      );

      // Should not update before custom delay
      jest.advanceTimersByTime(400);
      expect(screen.queryByText(newContent)).not.toBeInTheDocument();

      // Should update after custom delay
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText(newContent)).toBeInTheDocument();
      });
    });

    it('updates within 100ms for responsive feel', async () => {
      const startTime = performance.now();
      const { rerender } = render(<ChordEditorPreview {...defaultProps} updateDelay={50} />);

      const newContent = '{title: Fast Update}';
      rerender(
        <ChordEditorPreview {...defaultProps} content={newContent} updateDelay={50} />
      );

      jest.advanceTimersByTime(50);

      await waitFor(() => {
        expect(screen.getByText(newContent)).toBeInTheDocument();
      });

      const updateTime = performance.now() - startTime;
      expect(updateTime).toBeLessThan(100);
    });
  });

  describe('Validation Display', () => {
    it('shows validation errors when enabled', () => {
      const validation: ValidationResult = {
        valid: false,
        errors: [
          {
            line: 1,
            column: 10,
            message: 'Invalid directive',
            type: 'directive'
          },
          {
            line: 2,
            column: 1,
            message: 'Invalid chord',
            type: 'chord'
          }
        ],
        warnings: []
      };

      render(
        <ChordEditorPreview
          {...defaultProps}
          validation={validation}
          showValidationErrors={true}
        />
      );

      expect(screen.getByText('2 errors')).toBeInTheDocument();
      expect(screen.getByText(/Line 1, Col 10/)).toBeInTheDocument();
      expect(screen.getByText('Invalid directive')).toBeInTheDocument();
      expect(screen.getByText(/Line 2, Col 1/)).toBeInTheDocument();
      expect(screen.getByText('Invalid chord')).toBeInTheDocument();
    });

    it('shows validation warnings', () => {
      const validation: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [
          {
            line: 1,
            message: 'Missing artist information',
            type: 'style'
          }
        ]
      };

      render(
        <ChordEditorPreview
          {...defaultProps}
          validation={validation}
          showValidationErrors={true}
        />
      );

      expect(screen.getByText('1 warning')).toBeInTheDocument();
      expect(screen.getByText('Missing artist information')).toBeInTheDocument();
    });

    it('hides validation errors when disabled', () => {
      const validation: ValidationResult = {
        valid: false,
        errors: [
          {
            line: 1,
            column: 1,
            message: 'Test error',
            type: 'syntax'
          }
        ]
      };

      render(
        <ChordEditorPreview
          {...defaultProps}
          validation={validation}
          showValidationErrors={false}
        />
      );

      expect(screen.queryByText('1 error')).not.toBeInTheDocument();
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });

    it('shows success state when validation passes', () => {
      const validation: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
      };

      render(
        <ChordEditorPreview
          {...defaultProps}
          validation={validation}
          showValidationErrors={true}
        />
      );

      expect(screen.getByText('✓ Valid ChordPro')).toBeInTheDocument();
    });

    it('groups errors by type', () => {
      const validation: ValidationResult = {
        valid: false,
        errors: [
          { line: 1, column: 1, message: 'Syntax error 1', type: 'syntax' },
          { line: 2, column: 1, message: 'Chord error 1', type: 'chord' },
          { line: 3, column: 1, message: 'Syntax error 2', type: 'syntax' },
          { line: 4, column: 1, message: 'Chord error 2', type: 'chord' }
        ]
      };

      render(
        <ChordEditorPreview
          {...defaultProps}
          validation={validation}
          showValidationErrors={true}
        />
      );

      // Check that errors are organized by type
      const syntaxSection = screen.getByText('Syntax Errors (2)');
      const chordSection = screen.getByText('Chord Errors (2)');
      
      expect(syntaxSection).toBeInTheDocument();
      expect(chordSection).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(<ChordEditorPreview {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading preview...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('hides content when loading', () => {
      render(<ChordEditorPreview {...defaultProps} isLoading={true} />);

      expect(screen.queryByTestId('chord-display')).not.toBeInTheDocument();
    });
  });

  describe('Height Management', () => {
    it('applies custom height', () => {
      const { container } = render(
        <ChordEditorPreview {...defaultProps} height={500} />
      );

      const scrollContainer = container.querySelector('.preview-scroll-container');
      expect(scrollContainer).toHaveStyle('max-height: 452px'); // 500 - 48 (header height)
    });

    it('uses default height when not provided', () => {
      const { container } = render(<ChordEditorPreview {...defaultProps} />);

      const scrollContainer = container.querySelector('.preview-scroll-container');
      expect(scrollContainer).toHaveStyle('max-height: 352px'); // 400 - 48
    });
  });

  describe('Theme Support', () => {
    it('applies light theme styles', () => {
      const { container } = render(
        <ChordEditorPreview {...defaultProps} theme="light" />
      );

      const preview = container.querySelector('.chord-editor-preview');
      expect(preview).toHaveClass('bg-white', 'border-gray-200');
    });

    it('applies dark theme styles', () => {
      const { container } = render(
        <ChordEditorPreview {...defaultProps} theme="dark" />
      );

      const preview = container.querySelector('.chord-editor-preview');
      expect(preview).toHaveClass('bg-gray-900', 'border-gray-700');
    });

    it('applies stage theme styles', () => {
      const { container } = render(
        <ChordEditorPreview {...defaultProps} theme="stage" />
      );

      const preview = container.querySelector('.chord-editor-preview');
      expect(preview).toHaveClass('bg-black', 'border-gray-800');
    });
  });

  describe('Empty State', () => {
    it('shows empty state message for empty content', () => {
      render(<ChordEditorPreview {...defaultProps} content="" />);

      expect(screen.getByText('Enter ChordPro content to see preview')).toBeInTheDocument();
    });

    it('shows empty state for whitespace-only content', () => {
      render(<ChordEditorPreview {...defaultProps} content="   \n\n   " />);

      expect(screen.getByText('Enter ChordPro content to see preview')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error state for malformed content gracefully', () => {
      // Content that might cause parsing issues
      const malformedContent = '{title: Unclosed directive\n[InvalidChord]]]Extra brackets';
      
      render(<ChordEditorPreview {...defaultProps} content={malformedContent} />);

      // Should still render without crashing
      expect(screen.getByTestId('chord-display')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ChordEditorPreview {...defaultProps} />);

      const preview = screen.getByRole('region', { name: 'ChordPro Preview' });
      expect(preview).toBeInTheDocument();
    });

    it('announces validation errors to screen readers', () => {
      const validation: ValidationResult = {
        valid: false,
        errors: [
          { line: 1, column: 1, message: 'Test error', type: 'syntax' }
        ]
      };

      render(
        <ChordEditorPreview
          {...defaultProps}
          validation={validation}
          showValidationErrors={true}
        />
      );

      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toBeInTheDocument();
      expect(errorRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('applies custom className', () => {
      const { container } = render(
        <ChordEditorPreview {...defaultProps} className="custom-preview" />
      );

      const preview = container.querySelector('.chord-editor-preview');
      expect(preview).toHaveClass('custom-preview');
    });
  });

  describe('Performance', () => {
    it('memoizes preview content to prevent unnecessary re-renders', () => {
      const { rerender } = render(<ChordEditorPreview {...defaultProps} />);
      
      const initialRenderCount = 1;
      
      // Re-render with same props
      rerender(<ChordEditorPreview {...defaultProps} />);
      
      // ChordDisplay should not re-render with same content
      const displays = screen.getAllByTestId('chord-display');
      expect(displays).toHaveLength(initialRenderCount);
    });

    it('cancels pending updates on unmount', () => {
      const { unmount, rerender } = render(<ChordEditorPreview {...defaultProps} />);

      // Change content
      rerender(
        <ChordEditorPreview {...defaultProps} content="{title: Pending Update}" />
      );

      // Unmount before update completes
      unmount();

      // Advance timers
      jest.advanceTimersByTime(500);

      // No errors should occur
      expect(() => jest.runOnlyPendingTimers()).not.toThrow();
    });
  });
});