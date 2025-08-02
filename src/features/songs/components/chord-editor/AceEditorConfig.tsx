/**
 * @file AceEditorConfig.tsx
 * @description Ace editor configuration and initialization component for ChordPro editing
 */

import React, { useCallback, useEffect, useRef } from 'react';
import type { Ace } from 'ace-builds';
import type { ChordDisplayTheme } from '../../types/chord.types';
import { errorReporting } from '../../../../shared/services/errorReporting';

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

export interface AceEditorConfigProps {
  /** HTML element to mount the editor */
  editorElement: HTMLDivElement | null;
  /** Editor theme */
  theme: ChordDisplayTheme;
  /** Font size in pixels */
  fontSize: number;
  /** Read-only mode */
  readOnly: boolean;
  /** Enable auto-completion */
  autoComplete: boolean;
  /** Placeholder text */
  placeholder: string;
  /** Initial content */
  initialContent: string;
  /** Callback when editor is initialized */
  onEditorReady: (editor: Ace.Editor) => void;
  /** Callback when content changes */
  onContentChange: (content: string) => void;
  /** Callback when cursor position changes */
  onCursorChange: (position: { line: number; column: number }) => void;
  /** Custom keyboard shortcuts */
  keyboardShortcuts?: Array<{
    name: string;
    bindKey: { win: string; mac: string };
    exec: (editor: Ace.Editor) => void;
  }>;
}

/**
 * AceEditorConfig Component
 * 
 * Handles Ace editor initialization, configuration, and setup for ChordPro editing.
 * Manages themes, auto-completion, keyboard shortcuts, and editor options.
 */
export const AceEditorConfig = React.memo<AceEditorConfigProps>(({
  editorElement,
  theme,
  fontSize,
  readOnly,
  autoComplete,
  placeholder,
  initialContent,
  onEditorReady,
  onContentChange,
  onCursorChange,
  keyboardShortcuts = []
}) => {
  const editorRef = useRef<Ace.Editor | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Get Ace editor theme based on component theme
   */
  const getAceTheme = useCallback((editorTheme: ChordDisplayTheme) => {
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
   * Create ChordPro directives auto-completer
   */
  const createDirectiveCompleter = useCallback((): AceCompleter => ({
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
      } else {
        callback(null, null);
      }
    }
  }), []);

  /**
   * Create chord symbols auto-completer
   */
  const createChordCompleter = useCallback((): AceCompleter => ({
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
      } else {
        callback(null, null);
      }
    }
  }), []);

  /**
   * Initialize Ace editor with ChordPro configuration
   */
  const initializeEditor = useCallback(async () => {
    if (!editorElement || isInitializedRef.current) return;

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
      const editor = ace.edit(editorElement);
      
      // Configure editor
      editor.setTheme(getAceTheme(theme));
      editor.session.setMode('ace/mode/text'); // Will be enhanced with ChordPro mode
      editor.setFontSize(`${fontSize}px`);
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
      editor.setValue(initialContent, -1);

      // Event handlers
      editor.on('change', () => {
        const newContent = editor.getValue();
        onContentChange(newContent);
      });

      editor.on('changeSelection', () => {
        const selection = editor.getSelectionRange();
        onCursorChange({
          line: selection.start.row,
          column: selection.start.column
        });
      });

      // Add custom keyboard shortcuts
      keyboardShortcuts.forEach(shortcut => {
        editor.commands.addCommand({
          name: shortcut.name,
          bindKey: shortcut.bindKey,
          exec: shortcut.exec
        });
      });

      // Setup auto-completion
      if (autoComplete) {
        const langTools = ace.require('ace/ext/language_tools');
        langTools.addCompleter(createDirectiveCompleter());
        langTools.addCompleter(createChordCompleter());
      }

      editorRef.current = editor as Ace.Editor;
      isInitializedRef.current = true;
      onEditorReady(editor as Ace.Editor);

    } catch (error) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportComponentError(
        'Failed to initialize Ace editor',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'AceEditorConfig',
          operation: 'initialize_editor',
          theme,
          fontSize,
          readOnly,
          autoComplete,
        }
      );
    }
  }, [
    editorElement,
    theme,
    fontSize,
    readOnly,
    autoComplete,
    placeholder,
    initialContent,
    getAceTheme,
    onEditorReady,
    onContentChange,
    onCursorChange,
    keyboardShortcuts,
    createDirectiveCompleter,
    createChordCompleter
  ]);

  /**
   * Update editor theme
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setTheme(getAceTheme(theme));
    }
  }, [theme, getAceTheme]);

  /**
   * Update editor font size
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setFontSize(`${fontSize}px`);
    }
  }, [fontSize]);

  /**
   * Update read-only state
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setReadOnly(readOnly);
    }
  }, [readOnly]);

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
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  // This component doesn't render anything - it just configures the editor
  return null;
});

AceEditorConfig.displayName = 'AceEditorConfig';