/**
 * @file useSyntaxHighlight.ts
 * @description Hook for parsing ChordPro content and generating syntax highlighting
 */

import { useMemo } from 'react';

export interface HighlightedSegment {
  text: string;
  type: 'text' | 'chord' | 'directive' | 'comment' | 'section' | 'tab';
  className: string;
}

export const useSyntaxHighlight = (content: string): HighlightedSegment[] => {
  return useMemo(() => {
    if (!content) return [];

    const segments: HighlightedSegment[] = [];
    let currentIndex = 0;

    // Regex patterns for different ChordPro elements
    const patterns = [
      // Chord brackets - [Am], [G/B], etc.
      { regex: /\[([^\]]+)\]/g, type: 'chord' as const, className: 'text-blue-600 font-semibold' },
      
      // Section directives - {start_of_chorus}, {soc}, etc.
      { 
        regex: /\{(start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov|start_of_bridge|end_of_bridge|sob|eob|start_of_tab|end_of_tab|sot|eot)\}/g, 
        type: 'section' as const, 
        className: 'text-purple-600 font-medium' 
      },
      
      // Comment directives - {comment:...}, {c:...}
      { 
        regex: /\{(comment|c):\s*([^}]*)\}/g, 
        type: 'comment' as const, 
        className: 'text-gray-500 italic' 
      },
      
      // Other directives - {title:...}, {key:...}, etc.
      { 
        regex: /\{([^}:]+):\s*([^}]*)\}/g, 
        type: 'directive' as const, 
        className: 'text-green-600 font-medium' 
      },
      
      // Simple directives without colons - {chorus}, {verse}, etc.
      { 
        regex: /\{([^}]+)\}/g, 
        type: 'directive' as const, 
        className: 'text-green-600 font-medium' 
      }
    ];

    // Find all matches and their positions, avoiding overlaps
    const allMatches: Array<{
      index: number;
      length: number;
      text: string;
      type: 'chord' | 'directive' | 'comment' | 'section' | 'tab';
      className: string;
    }> = [];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(content)) !== null) {
        // Check if this match overlaps with any existing match
        const hasOverlap = allMatches.some(existing => 
          (match.index >= existing.index && match.index < existing.index + existing.length) ||
          (match.index + match[0].length > existing.index && match.index + match[0].length <= existing.index + existing.length) ||
          (match.index <= existing.index && match.index + match[0].length >= existing.index + existing.length)
        );

        if (!hasOverlap) {
          allMatches.push({
            index: match.index,
            length: match[0].length,
            text: match[0],
            type: pattern.type,
            className: pattern.className
          });
        }
      }
    });

    // Sort matches by position
    allMatches.sort((a, b) => a.index - b.index);

    // Build segments array
    allMatches.forEach(match => {
      // Add any plain text before this match
      if (match.index > currentIndex) {
        const plainText = content.slice(currentIndex, match.index);
        if (plainText) {
          segments.push({
            text: plainText,
            type: 'text',
            className: ''
          });
        }
      }

      // Add the highlighted match
      segments.push({
        text: match.text,
        type: match.type,
        className: match.className
      });

      currentIndex = match.index + match.length;
    });

    // Add any remaining plain text
    if (currentIndex < content.length) {
      const remainingText = content.slice(currentIndex);
      if (remainingText) {
        segments.push({
          text: remainingText,
          type: 'text',
          className: ''
        });
      }
    }

    return segments;
  }, [content]);
};