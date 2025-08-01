/**
 * @file ChordDisplay.test.tsx
 * @description Comprehensive tests for ChordDisplay component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChordDisplay } from '../components/ChordDisplay';

// Sample ChordPro content for testing
const sampleChordPro = `{title: Amazing Grace}
{subtitle: Traditional}
{key: G}
{tempo: 90}
{time: 3/4}

{verse}
[G]Amazing [C]grace, how [G]sweet the sound
That [D]saved a [G]wretch like me
[G]I once was [C]lost, but [G]now I'm found
Was [D]blind, but [G]now I see

{chorus}
'Twas [G]grace that [C]taught my [G]heart to fear
And [D]grace my [G]fears relieved
How [G]precious [C]did that [G]grace appear
The [D]hour I [G]first believed`;

const simpleChordPro = `{title: Simple Song}
[C]Hello [G]world [Am]test [F]song`;

const invalidContent = `This is not ChordPro content`;

describe('ChordDisplay', () => {
  describe('Basic Rendering', () => {
    it('renders ChordPro content as formatted HTML', () => {
      render(<ChordDisplay content={sampleChordPro} />);

      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.getByText('Traditional')).toBeInTheDocument();
      expect(screen.getByText('Key: G')).toBeInTheDocument();
      expect(screen.getByText('Tempo: 90')).toBeInTheDocument();
      expect(screen.getByText('Time: 3/4')).toBeInTheDocument();
    });

    it('renders chords with proper styling', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} />);

      const chordElements = container.querySelectorAll('.chord');
      expect(chordElements.length).toBeGreaterThan(0);
      
      // Check chord content - find all instances
      const cChords = screen.getAllByText('C');
      const gChords = screen.getAllByText('G');
      const amChords = screen.getAllByText('Am');
      const fChords = screen.getAllByText('F');
      
      expect(cChords.length).toBeGreaterThan(0);
      expect(gChords.length).toBeGreaterThan(0);
      expect(amChords.length).toBeGreaterThan(0);
      expect(fChords.length).toBeGreaterThan(0);
    });

    it('handles empty content gracefully', () => {
      render(<ChordDisplay content="" />);
      expect(screen.getByText('No chord chart to display')).toBeInTheDocument();
    });

    it('handles invalid content with error message', () => {
      render(<ChordDisplay content={invalidContent} />);
      expect(screen.getByText('Unable to display chord chart')).toBeInTheDocument();
    });
  });

  describe('Transposition', () => {
    it('transposes chords when transpose prop changes', () => {
      const { rerender } = render(
        <ChordDisplay content={simpleChordPro} transpose={0} />
      );

      // Original chords
      expect(screen.getAllByText('C').length).toBeGreaterThan(0);
      expect(screen.getAllByText('G').length).toBeGreaterThan(0);

      // Transpose up 2 semitones (C -> D, G -> A)
      rerender(<ChordDisplay content={simpleChordPro} transpose={2} />);

      expect(screen.getAllByText('D').length).toBeGreaterThan(0);
      expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    });

    it('shows transpose indicator when transposed', () => {
      render(<ChordDisplay content={simpleChordPro} transpose={3} />);
      expect(screen.getByText('Transposed +3 semitones')).toBeInTheDocument();
    });

    it('shows negative transpose indicator', () => {
      render(<ChordDisplay content={simpleChordPro} transpose={-2} />);
      expect(screen.getByText('Transposed -2 semitones')).toBeInTheDocument();
    });

    it('clamps transpose values to valid range', () => {
      const onTransposeChange = vi.fn();
      render(
        <ChordDisplay 
          content={simpleChordPro} 
          transpose={20} 
          onTransposeChange={onTransposeChange}
        />
      );

      expect(onTransposeChange).toHaveBeenCalledWith(0);
    });

    it('calls onTransposeChange when transpose is clamped', () => {
      const onTransposeChange = vi.fn();
      render(
        <ChordDisplay 
          content={simpleChordPro} 
          transpose={-20} 
          onTransposeChange={onTransposeChange}
        />
      );

      expect(onTransposeChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Theming', () => {
    it('applies light theme styles by default', () => {
      const { container } = render(<ChordDisplay content={sampleChordPro} />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toHaveClass('bg-white', 'text-gray-900');
    });

    it('applies dark theme styles', () => {
      const { container } = render(<ChordDisplay content={sampleChordPro} theme="dark" />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toHaveClass('bg-gray-900', 'text-gray-100');
    });

    it('applies stage theme styles with high contrast', () => {
      const { container } = render(<ChordDisplay content={sampleChordPro} theme="stage" />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toHaveClass('bg-black', 'text-white');
      
      const title = screen.getAllByText('Amazing Grace')[0];
      expect(title).toHaveClass('text-yellow-400');
    });
  });

  describe('Font Size', () => {
    it('applies default font size', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} />);
      
      const chartContainer = container.querySelector('[role="document"]') as HTMLElement;
      expect(chartContainer.style.fontSize).toBe('18px');
    });

    it('applies custom font size', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} fontSize={24} />);
      
      const chartContainer = container.querySelector('[role="document"]') as HTMLElement;
      expect(chartContainer.style.fontSize).toBe('24px');
    });

    it('clamps font size to valid range', () => {
      // Too small
      const { rerender, container } = render(
        <ChordDisplay content={simpleChordPro} fontSize={10} />
      );
      
      let chartContainer = container.querySelector('[role="document"]') as HTMLElement;
      expect(chartContainer.style.fontSize).toBe('16px');

      // Too large
      rerender(<ChordDisplay content={simpleChordPro} fontSize={50} />);
      
      chartContainer = container.querySelector('[role="document"]') as HTMLElement;
      expect(chartContainer.style.fontSize).toBe('32px');
    });
  });

  describe('Chord Visibility', () => {
    it('shows chords by default', () => {
      render(<ChordDisplay content={simpleChordPro} />);
      
      expect(screen.getAllByText('C').length).toBeGreaterThan(0);
      expect(screen.getAllByText('G').length).toBeGreaterThan(0);
    });

    it('hides chords when showChords is false', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} showChords={false} />);
      
      // Chords should not be visible
      const chordElements = container.querySelectorAll('.chord');
      expect(chordElements).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const { container } = render(<ChordDisplay content={sampleChordPro} />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toHaveAttribute('role', 'document');
      expect(chartContainer).toHaveAttribute('aria-label', 'Chord chart for Amazing Grace');
    });

    it('has ARIA label without title', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toHaveAttribute('aria-label', 'Chord chart for Simple Song');
    });

    it('has proper error state ARIA attributes', () => {
      const { container } = render(<ChordDisplay content={invalidContent} />);
      
      const errorContainer = container.querySelector('[role="alert"]');
      expect(errorContainer).toHaveAttribute('role', 'alert');
      expect(errorContainer).toHaveAttribute('aria-label', 'ChordPro parsing error');
    });

    it('has proper empty state ARIA attributes', () => {
      const { container } = render(<ChordDisplay content="" />);
      
      const emptyContainer = container.querySelector('[role="status"]');
      expect(emptyContainer).toHaveAttribute('role', 'status');
      expect(emptyContainer).toHaveAttribute('aria-label', 'No chord chart content');
    });
  });

  describe('Interactions', () => {
    it('handles chord clicks', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<ChordDisplay content={simpleChordPro} />);
      
      const chordElements = screen.getAllByText('C');
      fireEvent.click(chordElements[0]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Chord clicked:', 'C');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} className="custom-class" />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toHaveClass('custom-class');
    });

    it('renders component correctly', () => {
      const { container } = render(<ChordDisplay content={simpleChordPro} />);
      
      const chartContainer = container.querySelector('[role="document"]');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('memoizes parsed content', () => {
      const { rerender } = render(
        <ChordDisplay content={sampleChordPro} transpose={0} />
      );

      const initialTitle = screen.getByText('Amazing Grace');
      
      // Rerender with same props - should use memoized result
      rerender(<ChordDisplay content={sampleChordPro} transpose={0} />);
      
      const rerenderedTitle = screen.getByText('Amazing Grace');
      expect(rerenderedTitle).toBe(initialTitle);
    });

    it('updates when content changes', () => {
      const { rerender } = render(
        <ChordDisplay content={simpleChordPro} />
      );

      expect(screen.getByText('Simple Song')).toBeInTheDocument();
      
      rerender(<ChordDisplay content={sampleChordPro} />);
      
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
      expect(screen.queryByText('Simple Song')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles malformed ChordPro gracefully', () => {
      const malformedContent = `{title: Unclosed tag
[C]Test content`;
      
      render(<ChordDisplay content={malformedContent} />);
      
      // Should show error message for malformed content
      expect(screen.getByText('Unable to display chord chart')).toBeInTheDocument();
    });

    it('logs warnings for invalid props', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <ChordDisplay 
          content={simpleChordPro} 
          transpose={50} 
          fontSize={100}
        />
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid transpose level')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Font size')
      );
      
      consoleSpy.mockRestore();
    });
  });
});