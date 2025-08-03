/**
 * @file ChordProTextArea.tsx
 * @description Native textarea component with ChordPro-specific enhancements
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '../../../../shared/utils/cn';

interface ChordProTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  onSelectionChange?: (range: [number, number]) => void;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  onAutoCompleteShow?: (triggerChar: '{' | '[', position: number, filterText: string) => void;
  onAutoCompleteHide?: () => void;
  onAutoCompleteMove?: (direction: 'up' | 'down') => void;
  onAutoCompleteSelect?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  justCompletedDirective?: { position: number; timestamp: number } | null;
  onDirectiveCompleted?: () => void;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export const ChordProTextArea: React.FC<ChordProTextAreaProps> = ({
  value,
  onChange,
  onCursorChange,
  onSelectionChange,
  onScroll,
  onAutoCompleteShow,
  onAutoCompleteHide,
  onAutoCompleteMove,
  onAutoCompleteSelect,
  textareaRef: externalRef,
  justCompletedDirective,
  onDirectiveCompleted,
  fontSize = 16,
  theme = 'light',
  placeholder = 'Start typing your ChordPro song...',
  className,
  readOnly = false,
  autoFocus = false
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  /**
   * Handle text changes and trigger auto-completion
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check for auto-completion triggers
    if (onAutoCompleteShow && cursorPos > 0) {
      const charBefore = newValue[cursorPos - 1];
      
      if (charBefore === '{' || charBefore === '[') {
        // Show auto-completion for trigger character
        onAutoCompleteShow(charBefore as '{' | '[', cursorPos - 1, '');
      } else {
        // Check if we're still typing after a trigger
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const lastOpenBrace = Math.max(
          textBeforeCursor.lastIndexOf('{'),
          textBeforeCursor.lastIndexOf('[')
        );
        
        if (lastOpenBrace >= 0) {
          const triggerChar = newValue[lastOpenBrace] as '{' | '[';
          const afterTrigger = textBeforeCursor.substring(lastOpenBrace + 1);
          
          // Check if there's a closing bracket/brace after the trigger
          const hasClosing = (triggerChar === '{' && afterTrigger.includes('}')) ||
                           (triggerChar === '[' && afterTrigger.includes(']'));
          
          if (!hasClosing && /^[a-zA-Z0-9_:]*$/.test(afterTrigger)) {
            // Update auto-completion with filter text
            onAutoCompleteShow(triggerChar, lastOpenBrace, afterTrigger);
          } else {
            // Hide auto-completion if context is no longer valid
            onAutoCompleteHide?.();
          }
        } else {
          // No trigger character found, hide auto-completion
          onAutoCompleteHide?.();
        }
      }
    }
  }, [onChange, onAutoCompleteShow, onAutoCompleteHide]);

  /**
   * Handle selection changes
   */
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;

    const { selectionStart, selectionEnd } = textareaRef.current;
    
    // Clear directive completion state if cursor moved away from directive area
    if (justCompletedDirective) {
      // Find the directive area - from { to } or end of line if no }
      const directiveStart = value.lastIndexOf('{', justCompletedDirective.position);
      const closingBracketIndex = value.indexOf('}', justCompletedDirective.position);
      const directiveEnd = closingBracketIndex !== -1 ? closingBracketIndex : value.indexOf('\n', justCompletedDirective.position);
      
      if (directiveStart === -1 || 
          selectionStart < directiveStart || 
          (directiveEnd !== -1 && selectionStart > directiveEnd)) {
        onDirectiveCompleted?.();
      }
    }
    
    if (selectionStart === selectionEnd) {
      onCursorChange?.(selectionStart);
    } else {
      onSelectionChange?.([selectionStart, selectionEnd]);
    }
  }, [onCursorChange, onSelectionChange, justCompletedDirective, onDirectiveCompleted, value, textareaRef]);

  /**
   * Handle scroll events
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    onScroll?.(target.scrollTop, target.scrollLeft);
  }, [onScroll]);

  /**
   * Handle key down events for special behaviors and auto-completion navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Auto-completion navigation keys
    if (e.key === 'Escape') {
      onAutoCompleteHide?.();
      return;
    }

    if (e.key === 'ArrowUp') {
      // Check if auto-completion is visible
      if (onAutoCompleteMove) {
        e.preventDefault();
        onAutoCompleteMove('up');
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      // Check if auto-completion is visible
      if (onAutoCompleteMove) {
        e.preventDefault();
        onAutoCompleteMove('down');
        return;
      }
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      // Check if auto-completion is visible and should handle selection
      if (onAutoCompleteSelect) {
        e.preventDefault();
        onAutoCompleteSelect();
        return;
      }
    }

    // Tab key inserts 4 spaces (when auto-completion is not handling it)
    if (e.key === 'Tab' && !onAutoCompleteSelect) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    ';
      
      const newValue = value.substring(0, start) + spaces + value.substring(end);
      onChange(newValue);
      
      // Move cursor after inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
      return;
    }

    // Auto-indent on Enter (when auto-completion is not handling it)
    if (e.key === 'Enter' && !onAutoCompleteSelect) {
      const start = textarea.selectionStart;
      
      // Check if we just completed a directive and should handle Enter specially
      if (justCompletedDirective && 
          Date.now() - justCompletedDirective.timestamp < 5000 && // 5 second window
          start >= justCompletedDirective.position) { // Cursor is after or at completion position
        
        // Check if we need to add closing bracket
        const textAfterCursor = value.substring(start);
        const needsClosingBracket = !textAfterCursor.startsWith('}');
        
        if (needsClosingBracket) {
          // Add closing bracket, then newline
          e.preventDefault();
          const newValue = value.substring(0, start) + '}\n' + value.substring(start);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2; // After }\n
          }, 0);
        } else {
          // Closing bracket exists, just insert newline and leave } in place
          e.preventDefault();
          const newValue = value.substring(0, start) + '\n' + value.substring(start);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1; // After \n
          }, 0);
        }
        
        // Clear the directive completion state
        onDirectiveCompleted?.();
        return;
      }
      
      const lines = value.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';
      
      if (indent) {
        e.preventDefault();
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  }, [value, onChange, onAutoCompleteHide, onAutoCompleteMove, onAutoCompleteSelect, justCompletedDirective, onDirectiveCompleted, textareaRef]);

  /**
   * Clear directive completion state when cursor moves or other keys are pressed
   */
  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Clear directive completion state on any key except Enter
    if (justCompletedDirective && e.key !== 'Enter') {
      onDirectiveCompleted?.();
    }
  }, [justCompletedDirective, onDirectiveCompleted]);

  /**
   * Get theme-specific classes
   */
  const getThemeClasses = () => {
    const baseClasses = 'w-full h-full p-4 font-mono resize-none focus:outline-none bg-transparent text-transparent selection:bg-blue-200';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'caret-white selection:bg-blue-600');
      case 'stage':
        return cn(baseClasses, 'caret-yellow-300 selection:bg-yellow-600');
      default:
        return cn(baseClasses, 'caret-gray-900 selection:bg-blue-200');
    }
  };

  /**
   * Focus textarea on mount if autoFocus is true
   */
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, textareaRef]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onSelect={handleSelectionChange}
      onClick={handleSelectionChange}
      onKeyUp={(e) => {
        handleSelectionChange();
        handleKeyUp(e);
      }}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(getThemeClasses(), className)}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: '1.5',
        textAlign: 'left'
      }}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
    />
  );
};