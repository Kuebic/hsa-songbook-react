# ChordEditor Sub-components

This directory contains extracted sub-components for the ChordEditor to improve maintainability and separation of concerns.

## Components

### AceEditorConfig.tsx
Handles Ace editor initialization, configuration, and setup for ChordPro editing.

**Responsibilities:**
- Ace editor initialization with dynamic imports
- Theme management and switching
- Editor options configuration (autocompletion, line numbers, etc.)
- Auto-completion providers for ChordPro directives and chord symbols
- Event handler setup (content changes, cursor position)
- Keyboard shortcut registration

**Props:**
- `editorElement`: HTML element to mount the editor
- `theme`: Editor theme (light/dark/stage)
- `fontSize`: Font size in pixels
- `readOnly`: Read-only mode flag
- `autoComplete`: Enable auto-completion
- `placeholder`: Placeholder text
- `initialContent`: Initial editor content
- `keyboardShortcuts`: Array of custom keyboard shortcuts
- `onEditorReady`: Callback when editor is initialized
- `onContentChange`: Callback when content changes
- `onCursorChange`: Callback when cursor position changes

## Related Hooks

### useKeyboardShortcuts.ts
Hook for managing keyboard shortcuts in the ChordEditor.

**Features:**
- Default ChordPro-specific shortcuts (Ctrl+[, Ctrl+{, etc.)
- Custom shortcut registration
- Shortcut documentation and grouping
- Integration with Ace editor command system

**Default Shortcuts:**
- `Ctrl+[` / `Cmd+[`: Insert chord bracket [C]
- `Ctrl+{` / `Cmd+{`: Insert ChordPro directive {title: }
- `Ctrl+Shift+C` / `Cmd+Shift+C`: Insert chorus section
- `Ctrl+Shift+V` / `Cmd+Shift+V`: Insert verse section
- `Ctrl+/` / `Cmd+/`: Insert comment directive
- `Ctrl+D` / `Cmd+D`: Duplicate current line
- `Alt+Up` / `Option+Up`: Move lines up
- `Alt+Down` / `Option+Down`: Move lines down

## Usage

```tsx
import { AceEditorConfig } from './chord-editor/AceEditorConfig';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const { shortcuts } = useKeyboardShortcuts({
  onInsertTextWithCursor: (text, offset) => {
    // Handle text insertion with cursor positioning
  }
});

<AceEditorConfig
  editorElement={editorRef.current}
  theme="dark"
  fontSize={14}
  readOnly={false}
  autoComplete={true}
  placeholder="Start typing..."
  initialContent=""
  keyboardShortcuts={shortcuts}
  onEditorReady={handleEditorReady}
  onContentChange={handleContentChange}
  onCursorChange={handleCursorChange}
/>
```

## Benefits

- **Separation of Concerns**: Configuration logic separated from main component
- **Reusability**: Components can be reused in other editors
- **Testability**: Easier to unit test individual concerns
- **Maintainability**: Smaller, focused components
- **Customization**: Better support for configurable setups