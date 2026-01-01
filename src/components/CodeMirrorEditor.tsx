import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { search, highlightSelectionMatches, searchKeymap, openSearchPanel } from '@codemirror/search';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { getTheme } from '@/utils/themes';
import './CodeMirrorEditor.css';

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  fontSize?: number;
  theme?: string;
  placeholder?: string;
  cursorStyle?: 'block' | 'line' | 'underline';
  cursorBlink?: boolean;
  wordWrap?: boolean;
  lineNumbers?: boolean;
}

export interface CodeMirrorEditorHandle {
  openSearch: () => void;
  openFindAndReplace: () => void;
  insertText: (text: string) => void;
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => Promise<void>;
  selectAll: () => void;
  focus: () => void;
  getSelectedText: () => string;
  replaceSelectedText: (text: string) => void;
}

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, CodeMirrorEditorProps>(({
  value,
  onChange,
  onCursorChange,
  fontSize = 14,
  theme = 'light',
  placeholder,
  cursorStyle = 'line',
  cursorBlink = true,
  wordWrap = true,
  lineNumbers = true,
}, ref) => {
  const editorRef = useRef<any>(null);
  const viewRef = useRef<EditorView | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pasteHelperRef = useRef<HTMLTextAreaElement>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openSearch: () => {
      if (viewRef.current) {
        openSearchPanel(viewRef.current);
      }
    },
    openFindAndReplace: () => {
      if (viewRef.current) {
        // CodeMirror's search panel includes replace functionality
        openSearchPanel(viewRef.current);
      }
    },
    insertText: (text: string) => {
      if (viewRef.current) {
        const view = viewRef.current;
        const selection = view.state.selection.main;
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text },
          selection: { anchor: selection.from + text.length },
        });
        view.focus();
      }
    },
    undo: () => {
      if (viewRef.current) {
        undo(viewRef.current);
      }
    },
    redo: () => {
      if (viewRef.current) {
        redo(viewRef.current);
      }
    },
    cut: () => {
      if (viewRef.current) {
        document.execCommand('cut');
        viewRef.current.focus();
      }
    },
    copy: () => {
      if (viewRef.current) {
        document.execCommand('copy');
        viewRef.current.focus();
      }
    },
    paste: async () => {
      if (viewRef.current && pasteHelperRef.current) {
        const view = viewRef.current;
        const helper = pasteHelperRef.current;

        // Check if Clipboard API is available
        if (navigator.clipboard && navigator.clipboard.readText) {
          try {
            // Try to request clipboard permission first (for browsers that support it)
            if (navigator.permissions && navigator.permissions.query) {
              try {
                const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
                if (permissionStatus.state === 'denied') {
                  console.warn('Clipboard permission denied, using helper');
                  // Use helper element
                  helper.value = '';
                  helper.focus();
                  document.execCommand('paste');
                  return;
                }
              } catch (permError) {
                // Permission API might not support clipboard-read, continue anyway
                console.log('Permission query not supported, trying direct clipboard access');
              }
            }

            // Try to read from clipboard
            const text = await navigator.clipboard.readText();
            if (text) {
              const selection = view.state.selection.main;
              view.dispatch({
                changes: { from: selection.from, to: selection.to, insert: text },
                selection: { anchor: selection.from + text.length },
              });
            }
            view.focus();
          } catch (error) {
            console.error('Failed to read clipboard:', error);
            // Use helper element
            helper.value = '';
            helper.focus();
            document.execCommand('paste');
          }
        } else {
          // Clipboard API not available, use helper element
          helper.value = '';
          helper.focus();
          document.execCommand('paste');
        }
      }
    },
    selectAll: () => {
      if (viewRef.current) {
        const view = viewRef.current;
        const { doc } = view.state;
        view.dispatch({
          selection: { anchor: 0, head: doc.length },
        });
        view.focus();
      }
    },
    focus: () => {
      if (viewRef.current) {
        viewRef.current.focus();
      }
    },
    getSelectedText: () => {
      if (viewRef.current) {
        const view = viewRef.current;
        const selection = view.state.selection.main;
        return view.state.doc.sliceString(selection.from, selection.to);
      }
      return '';
    },
    replaceSelectedText: (text: string) => {
      if (viewRef.current) {
        const view = viewRef.current;
        const selection = view.state.selection.main;
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text },
          selection: { anchor: selection.from, head: selection.from + text.length },
        });
        view.focus();
      }
    },
  }));

  // Handle Page Up/Down at the React level to prevent CodeMirror from handling it
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!viewRef.current) {
      return;
    }

    const scroller = viewRef.current.scrollDOM;

    if (e.key === 'PageDown') {
      e.preventDefault();
      e.stopPropagation();

      const viewportHeight = scroller.clientHeight;
      const currentScroll = scroller.scrollTop;
      const scrollHeight = scroller.scrollHeight;
      const maxScroll = scrollHeight - viewportHeight;
      const scrollAmount = viewportHeight * 0.9;
      const newScroll = Math.min(currentScroll + scrollAmount, maxScroll);

      scroller.scrollTop = newScroll;
      return;
    }

    if (e.key === 'PageUp') {
      e.preventDefault();
      e.stopPropagation();

      const viewportHeight = scroller.clientHeight;
      const currentScroll = scroller.scrollTop;
      const scrollAmount = viewportHeight * 0.9;
      const newScroll = Math.max(currentScroll - scrollAmount, 0);

      scroller.scrollTop = newScroll;
      return;
    }
  };

  // Get theme colors based on selected theme - using centralized theme system
  const getThemeColors = (themeName: string) => {
    const currentTheme = getTheme(themeName);

    // Determine if the theme is dark based on background brightness
    const isDark = parseInt(currentTheme.colors.background.slice(1, 3), 16) < 128;

    // Create search match colors based on theme
    const searchMatch = currentTheme.colors.accent;
    const searchMatchSelected = currentTheme.colors.primary;

    return {
      bg: currentTheme.editor.background,
      text: currentTheme.editor.text,
      gutter: currentTheme.colors.surface,
      gutterText: currentTheme.editor.lineNumber,
      activeLine: currentTheme.colors.secondary,
      selection: currentTheme.editor.selection,
      searchMatch: searchMatch,
      searchMatchSelected: searchMatchSelected,
      searchOutline: searchMatch,
      caret: currentTheme.editor.cursor,
      isDark: isDark,
    };
  };

  const colors = getThemeColors(theme);

  // Cursor style mappings
  const getCursorCSS = () => {
    const blinkAnimation = cursorBlink ? 'blink 1.2s steps(1) infinite' : 'none';

    switch (cursorStyle) {
      case 'block':
        return {
          width: '0.65em',
          height: '1em',
          borderLeft: 'none',
          borderBottom: 'none',
          backgroundColor: colors.caret,
          animation: blinkAnimation,
        };
      case 'underline':
        return {
          width: '0.65em',
          height: '0.15em',
          borderLeft: 'none',
          borderBottom: `2px solid ${colors.caret}`,
          backgroundColor: 'transparent',
          animation: blinkAnimation,
        };
      case 'line':
      default:
        return {
          width: '0',
          height: '1em',
          borderLeft: `2px solid ${colors.caret}`,
          borderBottom: 'none',
          backgroundColor: 'transparent',
          animation: blinkAnimation,
        };
    }
  };

  const cursorCSS = getCursorCSS();

  // Custom theme based on our app themes
  const customTheme = EditorView.theme(
    {
      '&': {
        fontSize: `${fontSize}px`,
        height: '100%',
        maxHeight: '100%',
        backgroundColor: colors.bg,
        color: colors.text,
      },
      '&.cm-editor': {
        height: '100%',
        maxHeight: '100%',
      },
      '.cm-content': {
        fontFamily: 'monospace',
        padding: '10px 0',
        caretColor: colors.caret,
      },
      '.cm-cursor, .cm-dropCursor': {
        ...cursorCSS,
      },
      '.cm-line': {
        padding: '0 4px',
        lineHeight: '1.5',
      },
      '.cm-gutters': {
        backgroundColor: colors.gutter,
        color: colors.gutterText,
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: colors.activeLine,
      },
      '.cm-activeLine': {
        backgroundColor: colors.activeLine,
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: colors.selection,
      },
      '.cm-searchMatch': {
        backgroundColor: colors.searchMatch,
        outline: `1px solid ${colors.searchOutline}`,
      },
      '.cm-searchMatch-selected': {
        backgroundColor: colors.searchMatchSelected,
      },
      '&.cm-focused .cm-selectionBackground, &.cm-focused ::selection': {
        backgroundColor: colors.selection,
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'monospace',
      },
    },
    { dark: colors.isDark }
  );

  // Set up paste event listener for helper textarea
  useEffect(() => {
    const helper = pasteHelperRef.current;
    if (!helper) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text && viewRef.current) {
        const view = viewRef.current;
        const selection = view.state.selection.main;
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text },
          selection: { anchor: selection.from + text.length },
        });
        view.focus();
      }
    };

    helper.addEventListener('paste', handlePaste);
    return () => {
      helper.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Extensions for the editor
  const extensions = [
    history(),
    search({
      top: false, // Don't show built-in search panel at top
    }),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap.filter(binding => {
        // Remove default Page Up/Down handlers from defaultKeymap
        return binding.key !== 'PageDown' && binding.key !== 'PageUp';
      }),
      ...searchKeymap,
      ...historyKeymap,
    ]),
    ...(wordWrap ? [EditorView.lineWrapping] : []),
    customTheme,
    EditorView.updateListener.of((update: ViewUpdate) => {
      // Store the view reference for programmatic access
      if (!viewRef.current) {
        viewRef.current = update.view;
      }

      if (update.selectionSet && onCursorChange) {
        const pos = update.state.selection.main.head;
        onCursorChange(pos);
      }
    }),
  ];

  return (
    <div className="codemirror-wrapper" ref={wrapperRef} onKeyDown={handleKeyDown}>
      <textarea
        ref={pasteHelperRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={colors.isDark ? 'dark' : 'light'}
        placeholder={placeholder}
        style={{ height: '100%' }}
        basicSetup={{
          lineNumbers: lineNumbers,
          highlightActiveLineGutter: lineNumbers,
          highlightActiveLine: true,
          foldGutter: false,
          dropCursor: true,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightSelectionMatches: true,
          closeBracketsKeymap: false,
          searchKeymap: true,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
});

CodeMirrorEditor.displayName = 'CodeMirrorEditor';
