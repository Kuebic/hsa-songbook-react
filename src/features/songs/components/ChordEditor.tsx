/**
 * @file ChordEditor.tsx
 * @description ChordPro editor component with syntax highlighting and real-time validation
 */

import React, { useState, useMemo } from 'react';
import { cn } from '../../../shared/utils/cn';
import type { ChordEditorProps } from '../types/chord.types';
import { 
  EDITOR_FONT_SIZE_LIMITS, 
  EDITOR_HEIGHT_LIMITS
} from '../types/chord.types';
import { useChordEditor } from '../hooks/useChordEditor';
import { ChordEditorToolbar } from './ChordEditorToolbar';
import { ChordEditorPreview } from './ChordEditorPreview';
import { ChordEditorCore } from './ChordEditorCore';
import { ChordEditorSettings } from './ChordEditorSettings';
import { ChordEditorValidation } from './ChordEditorValidation';

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
  // Local state for cursor position and settings panel
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [showSettings, setShowSettings] = useState(false);

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

  // Handle toolbar actions
  const handleToolbarAction = (action: string, _payload?: any) => {
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
      case 'toggle-settings':
        setShowSettings(!showSettings);
        break;
      default:
        console.warn(`Unknown toolbar action: ${action}`);
    }
  };

  // Handle validation results
  React.useEffect(() => {
    if (onValidate && state.validation) {
      onValidate(state.validation);
    }
  }, [onValidate, state.validation]);


  return (
    <div 
      className={cn(
        'chord-editor',
        'rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700',
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

      {/* Settings Panel */}
      {showSettings && (
        <ChordEditorSettings
          theme={theme}
          onThemeChange={(_newTheme) => {
            // Theme changes would need to be handled by parent component
            // For now, just close settings
            setShowSettings(false);
          }}
          fontSize={validatedFontSize}
          onFontSizeChange={(size) => {
            // Font size changes would need to be handled by parent component
            console.log('Font size change requested:', size);
          }}
          height={validatedHeight}
          onHeightChange={(h) => {
            // Height changes would need to be handled by parent component
            console.log('Height change requested:', h);
          }}
          showPreview={showPreview}
          onShowPreviewChange={(show) => {
            // Preview toggle would need to be handled by parent component
            console.log('Preview toggle requested:', show);
          }}
          autoComplete={autoComplete}
          onAutoCompleteChange={(enabled) => {
            // Auto-complete toggle would need to be handled by parent component
            console.log('Auto-complete toggle requested:', enabled);
          }}
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
          {/* Core editor */}
          <ChordEditorCore
            content={content}
            onChange={(newContent) => {
              setContent(newContent);
              onChange(newContent);
            }}
            theme={theme}
            fontSize={validatedFontSize}
            readOnly={readOnly}
            autoComplete={autoComplete}
            placeholder={placeholder}
            height={validatedHeight - (showToolbar ? 50 : 0) - (showSettings ? 100 : 0) - 30} // Account for status bar
            onCursorChange={setCursorPosition}
          />

          {/* Status bar */}
          <div className="editor-status-bar border-t border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 flex justify-between">
            <span>
              Line {cursorPosition.line + 1}, Column {cursorPosition.column + 1}
            </span>
            <span>
              {content.length} characters
              {state.validation?.parseTime && (
                <span className="ml-2">
                  • Validated in {state.validation.parseTime.toFixed(1)}ms
                </span>
              )}
            </span>
          </div>

          {/* Validation display */}
          <ChordEditorValidation
            validation={state.validation || null}
            cursorPosition={cursorPosition}
          />
        </div>

        {/* Preview pane */}
        {showPreview && (
          <ChordEditorPreview
            content={content}
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