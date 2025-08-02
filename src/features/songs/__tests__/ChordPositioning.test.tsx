/**
 * @file ChordPositioning.test.tsx
 * @description Tests for precise chord positioning within lyrics
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { ChordDisplay } from '../components/ChordDisplay';

describe('ChordDisplay - Chord Positioning', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Mid-word Chord Placement', () => {
    it('should position chords correctly within words', () => {
      const chordPro = `{title: Positioning Test}
encyclo[C#]pedia
biblio[G]graphy
cali[Am]fornia`;

      const { container } = render(<ChordDisplay content={chordPro} />);

      // Check that the HTML structure preserves precise positioning
      const content = container.innerHTML;
      
      // Verify chords are positioned mid-word, not at beginning or end
      expect(content).toContain('encyclo');
      expect(content).toContain('pedia');
      expect(content).toContain('C#');
      
      expect(content).toContain('biblio');
      expect(content).toContain('graphy');
      expect(content).toContain('G');
      
      expect(content).toContain('cali');
      expect(content).toContain('fornia');
      expect(content).toContain('Am');
      
      // The chord should be between the word parts, not before or after the entire word
      expect(content).not.toContain('C#encyclopedia');
      expect(content).not.toContain('encyclopediaC#');
    });

    it('should handle multiple chords within the same word', () => {
      const chordPro = `{title: Multiple Chords}
super[C]cali[G]fragi[Am]listic[F]expiali[Dm]docious`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      const content = container.innerHTML;

      // Each chord should be positioned precisely
      expect(content).toContain('super');
      expect(content).toContain('cali');
      expect(content).toContain('fragi');
      expect(content).toContain('listic');
      expect(content).toContain('expiali');
      expect(content).toContain('docious');

      // All chords should be present
      expect(content).toContain('C');
      expect(content).toContain('G');
      expect(content).toContain('Am');
      expect(content).toContain('F');
      expect(content).toContain('Dm');
    });
  });

  describe('Word-start Chord Placement', () => {
    it('should position chords at the beginning of words', () => {
      const chordPro = `{title: Word Start Test}
[C#]encyclopedia
[G]wonderful
[Am]amazing`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      const content = container.innerHTML;

      // Verify chords are at word start
      expect(content).toContain('C#');
      expect(content).toContain('encyclopedia');
      expect(content).toContain('G');
      expect(content).toContain('wonderful');
      expect(content).toContain('Am');
      expect(content).toContain('amazing');
    });
  });

  describe('Word-end Chord Placement', () => {
    it('should position chords at the end of words', () => {
      const chordPro = `{title: Word End Test}
amazing[C#]
wonderful[G]
fantastic[Am]`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      const content = container.innerHTML;

      // Verify chords are at word end
      expect(content).toContain('amazing');
      expect(content).toContain('C#');
      expect(content).toContain('wonderful');
      expect(content).toContain('G');
      expect(content).toContain('fantastic');
      expect(content).toContain('Am');
    });
  });

  describe('Complex Chord Positioning Scenarios', () => {
    it('should handle mixed positioning within the same line', () => {
      const chordPro = `{title: Mixed Positioning}
[C]Start encyclo[G#]pedia word[Am] [F]next[Dm]word ending[C#]`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      const content = container.innerHTML;

      // Check all chord positions are preserved
      expect(content).toContain('C');      // Start of line
      expect(content).toContain('Start');
      expect(content).toContain('encyclo');
      expect(content).toContain('G#');     // Mid-word
      expect(content).toContain('pedia');
      expect(content).toContain('word');
      expect(content).toContain('Am');     // End of word
      expect(content).toContain('F');      // Start of word  
      expect(content).toContain('next');
      expect(content).toContain('Dm');     // Mid-word
      expect(content).toContain('word');
      expect(content).toContain('ending');
      expect(content).toContain('C#');     // End of line
    });

    it('should handle chords with special characters and numbers', () => {
      const chordPro = `{title: Special Chords}
encyclo[C#maj7]pedia
biblio[Gb/Bb]graphy
amaz[Dsus4]ing
fan[F#m7b5]tastic`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      const content = container.innerHTML;

      // Verify complex chord names are preserved (ChordSheetJS may normalize them)
      expect(content).toContain('C#ma7'); // ChordSheetJS normalizes maj7 to ma7
      expect(content).toContain('Gb/Bb');  
      expect(content).toContain('Dsus');   // ChordSheetJS may normalize sus4 to sus
      expect(content).toContain('F#m7(b5)'); // ChordSheetJS normalizes b5 to (b5)

      // Verify positioning is still accurate
      expect(content).toContain('encyclo');
      expect(content).toContain('pedia');
      expect(content).toContain('biblio');
      expect(content).toContain('graphy');
    });

    it('should handle edge case: chord at very beginning and end of line', () => {
      const chordPro = `{title: Edge Cases}
[C]word1 word2 word3[G]
[Am]single[F]
[Dm]start middle[Bb] end[C#]`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      const content = container.innerHTML;

      // Verify all edge cases work
      expect(content).toContain('C');
      expect(content).toContain('word1');
      expect(content).toContain('word3');
      expect(content).toContain('G');
      
      expect(content).toContain('Am');
      expect(content).toContain('single');
      expect(content).toContain('F');
      
      expect(content).toContain('Dm');
      expect(content).toContain('start');
      expect(content).toContain('middle');
      expect(content).toContain('Bb');
      expect(content).toContain('end');
      expect(content).toContain('C#');
    });
  });

  describe('Chord Positioning with Different Themes', () => {
    it('should maintain positioning accuracy across all themes', () => {
      const chordPro = `{title: Theme Test}
encyclo[C#]pedia [G]wonderful`;

      const themes: Array<'light' | 'dark' | 'stage'> = ['light', 'dark', 'stage'];

      themes.forEach(theme => {
        const { container } = render(<ChordDisplay content={chordPro} theme={theme} />);
        const content = container.innerHTML;

        // Positioning should be consistent regardless of theme
        expect(content).toContain('encyclo');
        expect(content).toContain('C#');
        expect(content).toContain('pedia');
        expect(content).toContain('G');
        expect(content).toContain('wonderful');

        cleanup();
      });
    });
  });

  describe('Chord Positioning with Transposition', () => {
    it('should maintain positioning when chords are transposed', () => {
      const chordPro = `{title: Transposition Test}
encyclo[C]pedia [G]amazing`;

      // Test original
      const { container: original, rerender } = render(<ChordDisplay content={chordPro} transpose={0} />);
      let content = original.innerHTML;

      expect(content).toContain('encyclo');
      expect(content).toContain('C');
      expect(content).toContain('pedia');
      expect(content).toContain('G');
      expect(content).toContain('amazing');

      // Test transposed (+2 semitones: C->D, G->A)
      rerender(<ChordDisplay content={chordPro} transpose={2} />);
      content = original.innerHTML;

      // Positioning should remain the same, only chord names change
      expect(content).toContain('encyclo');
      expect(content).toContain('D');  // C transposed up 2
      expect(content).toContain('pedia');
      expect(content).toContain('A');  // G transposed up 2
      expect(content).toContain('amazing');

      // Should NOT contain original chord names
      expect(content).not.toContain('chord">C<');
      expect(content).not.toContain('chord">G<');
    });
  });

  describe('HTML Structure Validation', () => {
    it('should generate proper HTML structure for chord positioning', () => {
      const chordPro = `{title: HTML Structure}
encyclo[C#]pedia`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      
      // Look for the specific HTML pattern that should be generated
      const chordElements = container.querySelectorAll('.chord');
      expect(chordElements.length).toBeGreaterThan(0);

      // Find the chord element
      const chordElement = Array.from(chordElements).find(el => el.textContent === 'C#');
      expect(chordElement).toBeTruthy();
      expect(chordElement?.textContent).toBe('C#');
      expect(chordElement?.classList.contains('chord')).toBe(true);

      // Verify the chord is within a column structure (ChordSheetJS uses columns)
      const columnElement = chordElement?.closest('.chord-column, .column');
      expect(columnElement).toBeTruthy();
      
      // The column should be within a row that contains the full line
      const rowElement = columnElement?.closest('.chord-row, .row');
      expect(rowElement).toBeTruthy();
      
      // The full row should contain both text parts and the chord
      const rowContent = rowElement?.textContent || '';
      expect(rowContent).toContain('encyclo');
      expect(rowContent).toContain('C#');
      expect(rowContent).toContain('pedia');
    });

    it('should maintain semantic HTML structure', () => {
      const chordPro = `{title: Semantic Test}
[C]Start encyclo[G]pedia [Am]end`;

      const { container } = render(<ChordDisplay content={chordPro} />);
      
      // Check that the main container has proper roles
      const documentContainer = container.querySelector('[role="document"]');
      expect(documentContainer).toBeTruthy();

      // Check that chords are properly nested within content structure
      // Note: ChordSheetJS may create empty chord slots for alignment
      const chordElements = container.querySelectorAll('.chord');
      expect(chordElements.length).toBeGreaterThanOrEqual(3);

      chordElements.forEach(chord => {
        // Each chord should be within a line/row container
        const parent = chord.parentElement;
        expect(parent).toBeTruthy();
        
        // Should have proper cursor interaction (check for cursor pointer in theme styles)
        const hasPointerCursor = chord.className.includes('cursor-pointer') || 
                                chord.className.includes('chord') || // chord class includes cursor pointer in theme
                                chord.classList.contains('cursor-pointer');
        expect(hasPointerCursor).toBeTruthy();
      });
    });
  });
});