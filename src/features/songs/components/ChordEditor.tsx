/**
 * @file ChordEditor.tsx
 * @description ChordPro editor component with syntax highlighting and real-time validation
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../../shared/utils/cn';
import type { ChordEditorProps } from '../types/chord.types';
import { 
  EDITOR_FONT_SIZE_LIMITS, 
  EDITOR_HEIGHT_LIMITS,
  THEME_STYLES
} from '../types/chord.types';
import { useChordEditor } from '../hooks/useChordEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ChordEditorToolbar } from './ChordEditorToolbar';
import { ChordEditorPreview } from './ChordEditorPreview';
import { AceEditorConfig } from './chord-editor/AceEditorConfig';

// Type imports for Ace editor
import type { Ace } from 'ace-builds';

/**
 * ChordEditor Component
 * 
 * A comprehensive ChordPro editor with syntax highlighting, validation, and auto-completion.
 * Uses ChordProject Editor (Ace-based) with custom ChordPro mode.
 * 
 * @example
 * ```tsx
 * <ChordEditor
 *   content={chordProContent}
 *   onChange={handleChange}
 *   onValidate={handleValidation}
 *   theme="dark"
 *   showPreview={true}
 *   autoComplete={true}
 * />
 * ```
 */
export const ChordEditor = React.memo<ChordEditorProps>(({
  content,
  onChange,
  onValidate,
  theme = 'light',
  fontSize = EDITOR_FONT_SIZE_LIMITS.DEFAULT,
  showPreview = false,
  autoComplete = true,
  showToolbar = true,
  height = EDITOR_HEIGHT_LIMITS.DEFAULT,
  className,
  placeholder = 'Start typing your ChordPro song...',
  readOnly = false,
  onAutoSave,
  autoSaveDelay = 5000
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const aceEditorRef = useRef<Ace.Editor | null>(null);

  // Validate and clamp props
  const validatedFontSize = useMemo(() => {
    const size = Math.max(EDITOR_FONT_SIZE_LIMITS.MIN, Math.min(EDITOR_FONT_SIZE_LIMITS.MAX, fontSize));
    if (size !== fontSize) {
      console.warn(`Editor font size ${fontSize} clamped to ${size}`);
    }
    return size;
  }, [fontSize]);

  const validatedHeight = useMemo(() => {
    const h = Math.max(EDITOR_HEIGHT_LIMITS.MIN, Math.min(EDITOR_HEIGHT_LIMITS.MAX, height));
    if (h !== height) {
      console.warn(`Editor height ${height} clamped to ${h}`);
    }
    return h;
  }, [height]);

  // Use editor hook for state management
  const {
    state,
    setContent,
    setCursor,
    insertText,
    undo,
    redo,
    canUndo,
    canRedo,
    format,
    save
  } = useChordEditor(
    content,
    {
      theme,
      fontSize: validatedFontSize,
      autoSave: !!onAutoSave,
      autoSaveDelay
    },
    onAutoSave
  );

  // Initialize keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts({
    onInsertTextWithCursor: (text: string, offset: number) => {
      if (aceEditorRef.current) {
        aceEditorRef.current.insert(text);
        if (offset !== 0) {
          const pos = aceEditorRef.current.getCursorPosition();
          aceEditorRef.current.moveCursorTo(pos.row, pos.column + offset);
        }
      }
    }
  });

  /**
   * Handle editor initialization
   */
  const handleEditorReady = useCallback((editor: Ace.Editor) => {
    aceEditorRef.current = editor;
  }, []);

  /**
   * Handle content changes from editor
   */
  const handleContentChange = useCallback((newContent: string) => {
    if (newContent !== state.content) {
      setContent(newContent);
      onChange(newContent);
    }
  }, [state.content, setContent, onChange]);

  /**
   * Handle cursor position changes
   */
  const handleCursorChange = useCallback((position: { line: number; column: number }) => {
    setCursor(position);
  }, [setCursor]);

  /**
   * Update editor content when prop changes
   */
  useEffect(() => {
    if (aceEditorRef.current && content !== aceEditorRef.current.getValue()) {
      const cursorPos = aceEditorRef.current.getCursorPosition();
      aceEditorRef.current.setValue(content, -1);
      aceEditorRef.current.moveCursorToPosition(cursorPos);
    }
  }, [content]);

  /**
   * Handle toolbar actions
   */
  const handleToolbarAction = useCallback((action: string) => {
    switch (action) {
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'insert-chord':
        insertText('[C]');
        break;
      case 'insert-directive':
        insertText('{title: }');
        break;
      case 'format':
        format();
        break;
      case 'save':
        save();
        break;
      default:
        console.warn(`Unknown toolbar action: ${action}`);
    }
  }, [undo, redo, insertText, format, save]);

  /**
   * Handle validation results
   */
  useEffect(() => {
    if (onValidate && state.validation) {
      onValidate(state.validation);
    }
  }, [onValidate, state.validation]);

  // Get theme styles for container
  const themeStyles = THEME_STYLES[theme];

  return (
    <div 
      className={cn(
        'chord-editor',
        themeStyles.container,
        'rounded-lg overflow-hidden',
        showPreview ? 'flex flex-col' : '',
        className
      )}
      style={{ height: `${validatedHeight}px` }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <ChordEditorToolbar
          validation={state.validation || undefined}
          isDirty={state.isDirty}
          canUndo={canUndo}
          canRedo={canRedo}
          theme={theme}
          showSave={!!onAutoSave}
          onAction={handleToolbarAction}
        />
      )}

      {/* Main content area */}
      <div className={cn('flex-1 flex', showPreview ? 'min-h-0' : '')}>
        {/* Editor container */}
        <div 
          className="flex-1 flex flex-col"
          style={{ 
            minWidth: showPreview ? '50%' : '100%'
          }}
        >
          <div 
            ref={editorRef}
            className="chord-editor-ace flex-1"
            style={{ 
              width: '100%'
            }}
            role="textbox"
            aria-label="ChordPro Editor"
            aria-multiline="true"
            tabIndex={0}
          />
          
          {/* Ace Editor Configuration */}
          <AceEditorConfig
            editorElement={editorRef.current}
            theme={theme}
            fontSize={validatedFontSize}
            readOnly={readOnly}
            autoComplete={autoComplete}
            placeholder={placeholder}
            initialContent={content}
            keyboardShortcuts={shortcuts}
            onEditorReady={handleEditorReady}
            onContentChange={handleContentChange}
            onCursorChange={handleCursorChange}
          />

          {/* Status bar */}
          <div className="editor-status-bar border-t border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 flex justify-between">
            <span>
              Line {state.cursor.line + 1}, Column {state.cursor.column + 1}
            </span>
            <span>
              {state.content.length} characters
              {state.validation?.parseTime && (
                <span className="ml-2">
                  • Validated in {state.validation.parseTime.toFixed(1)}ms
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Preview pane */}
        {showPreview && (
          <ChordEditorPreview
            content={state.content}
            theme={theme}
            validation={state.validation || undefined}
            showValidationErrors={true}
            height={validatedHeight - (showToolbar ? 50 : 0)}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
});

ChordEditor.displayName = 'ChordEditor';