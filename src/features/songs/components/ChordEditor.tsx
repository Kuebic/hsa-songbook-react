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
import { ChordEditorToolbar } from './ChordEditorToolbar';
import { ChordEditorPreview } from './ChordEditorPreview';

// Type imports for Ace editor
import type { Ace } from 'ace-builds';

// Ace editor completion types
interface AceCompletion {
  caption: string;
  value: string;
  meta: string;
}

interface AceCompleter {
  getCompletions: (
    editor: Ace.Editor,
    session: Ace.EditSession,
    pos: Ace.Position,
    prefix: string,
    callback: (error: Error | null, completions: AceCompletion[] | null) => void
  ) => void;
}

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
  const isInitializedRef = useRef(false);

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

  /**
   * Get Ace editor theme based on component theme
   */
  const getAceTheme = useCallback((editorTheme: string) => {
    switch (editorTheme) {
      case 'dark':
        return 'ace/theme/monokai';
      case 'stage':
        return 'ace/theme/terminal';
      default:
        return 'ace/theme/github';
    }
  }, []);

  /**
   * Initialize Ace editor with ChordPro mode
   */
  const initializeEditor = useCallback(async () => {
    if (!editorRef.current || isInitializedRef.current) return;

    try {
      // Load Ace editor if not already loaded
      if (!window.ace) {
        // Dynamic import for code splitting
        await import('ace-builds/src-noconflict/ace');
        await import('ace-builds/src-noconflict/mode-text');
        await import('ace-builds/src-noconflict/theme-github');
        await import('ace-builds/src-noconflict/theme-monokai');
        await import('ace-builds/src-noconflict/theme-terminal');
        await import('ace-builds/src-noconflict/ext-language_tools');
      }

      const ace = window.ace;
      const editor = ace.edit(editorRef.current);
      
      // Configure editor
      editor.setTheme(getAceTheme(theme));
      editor.session.setMode('ace/mode/text'); // Will be enhanced with ChordPro mode
      editor.setFontSize(`${validatedFontSize}px`);
      editor.setReadOnly(readOnly);
      
      // Editor options
      editor.setOptions({
        enableBasicAutocompletion: autoComplete,
        enableLiveAutocompletion: autoComplete,
        enableSnippets: true,
        showLineNumbers: true,
        showGutter: true,
        highlightActiveLine: true,
        wrap: true,
        tabSize: 2,
        useSoftTabs: true,
        placeholder
      });

      // Set initial content
      editor.setValue(content, -1);

      // Event handlers
      editor.on('change', () => {
        const newContent = editor.getValue();
        if (newContent !== state.content) {
          setContent(newContent);
          onChange(newContent);
        }
      });

      editor.on('changeSelection', () => {
        const selection = editor.getSelectionRange();
        setCursor({
          line: selection.start.row,
          column: selection.start.column
        });
      });

      // Custom keyboard shortcuts
      editor.commands.addCommand({
        name: 'insertChord',
        bindKey: { win: 'Ctrl-[', mac: 'Cmd-[' },
        exec: () => {
          editor.insert('[C]');
        }
      });

      editor.commands.addCommand({
        name: 'insertDirective',
        bindKey: { win: 'Ctrl-{', mac: 'Cmd-{' },
        exec: () => {
          editor.insert('{title: }');
          const pos = editor.getCursorPosition();
          editor.moveCursorTo(pos.row, pos.column - 1);
        }
      });

      // Custom auto-completion
      if (autoComplete) {
        const langTools = ace.require('ace/ext/language_tools');
        
        // ChordPro directives completer
        const directiveCompleter: AceCompleter = {
          getCompletions: (_editor, session, pos, _prefix, callback) => {
            const line = session.getLine(pos.row);
            const beforeCursor = line.slice(0, pos.column);
            
            if (beforeCursor.includes('{')) {
              const completions = [
                'title', 'subtitle', 'artist', 'composer', 'key', 'time', 'tempo',
                'start_of_chorus', 'end_of_chorus', 'soc', 'eoc',
                'start_of_verse', 'end_of_verse', 'sov', 'eov',
                'comment', 'c'
              ].map(directive => ({
                caption: directive,
                value: `${directive}: `,
                meta: 'directive'
              }));
              
              callback(null, completions);
            }
          }
        };

        // Chord symbols completer
        const chordCompleter: AceCompleter = {
          getCompletions: (_editor, session, pos, _prefix, callback) => {
            const line = session.getLine(pos.row);
            const beforeCursor = line.slice(0, pos.column);
            
            if (beforeCursor.includes('[') && !beforeCursor.includes(']')) {
              const completions = [
                'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
                'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7'
              ].map(chord => ({
                caption: chord,
                value: chord,
                meta: 'chord'
              }));
              
              callback(null, completions);
            }
          }
        };

        langTools.addCompleter(directiveCompleter);
        langTools.addCompleter(chordCompleter);
      }

      aceEditorRef.current = editor as unknown as Ace.Editor;
      isInitializedRef.current = true;

    } catch (error) {
      console.error('Failed to initialize ChordEditor:', error);
    }
  }, [
    theme,
    validatedFontSize,
    readOnly,
    autoComplete,
    placeholder,
    content,
    state.content,
    setContent,
    onChange,
    setCursor,
    getAceTheme
  ]);

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
   * Update editor theme
   */
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setTheme(getAceTheme(theme));
    }
  }, [theme, getAceTheme]);

  /**
   * Update editor font size
   */
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setFontSize(`${validatedFontSize}px`);
    }
  }, [validatedFontSize]);

  /**
   * Initialize editor on mount
   */
  useEffect(() => {
    initializeEditor();
  }, [initializeEditor]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (aceEditorRef.current) {
        aceEditorRef.current.destroy();
        aceEditorRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

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