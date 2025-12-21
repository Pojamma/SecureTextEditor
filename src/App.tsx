import React, { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from './stores/documentStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { generateId, formatDate, getCursorPosition, countCharacters } from './utils/helpers';
import { OpenDocument } from './types/document.types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { HamburgerMenu } from './components/Menus/HamburgerMenu';
import { Notification } from './components/Notification';
import { EditorTabs } from './components/EditorTabs';
import { SessionService } from './services/session.service';
import './App.css';

const App: React.FC = () => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1 });

  // Store hooks
  const { documents, activeDocumentId, addDocument, updateContent, updateDocument, getActiveDocument, closeDocument, setActiveDocument, restoreSession } =
    useDocumentStore();
  const { theme, setTheme, fontSize, setFontSize, statusBar } = useSettingsStore();
  const { toggleMenu, showSearch, showNotification } = useUIStore();

  const activeDoc = getActiveDocument();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      action: () => {
        const newDoc: OpenDocument = {
          id: generateId(),
          path: '',
          source: 'temp',
          encrypted: false,
          content: '',
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: {
            created: formatDate(),
            modified: formatDate(),
            filename: 'Untitled.txt',
          },
        };
        addDocument(newDoc);
        showNotification('New document created', 'success');
      },
      description: 'New Document',
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        showNotification('Save functionality coming soon!', 'info');
      },
      description: 'Save',
    },
    {
      key: 'w',
      ctrl: true,
      action: () => {
        if (activeDocumentId) {
          closeDocument(activeDocumentId);
          showNotification('Tab closed', 'info');
        }
      },
      description: 'Close Tab',
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        showSearch();
        showNotification('Search coming soon!', 'info');
      },
      description: 'Find',
    },
    {
      key: '=',
      ctrl: true,
      action: () => {
        setFontSize(Math.min(fontSize + 2, 24));
      },
      description: 'Zoom In',
    },
    {
      key: '-',
      ctrl: true,
      action: () => {
        setFontSize(Math.max(fontSize - 2, 8));
      },
      description: 'Zoom Out',
    },
    {
      key: '0',
      ctrl: true,
      action: () => {
        setFontSize(14);
      },
      description: 'Reset Zoom',
    },
    // Tab navigation
    {
      key: 'Tab',
      ctrl: true,
      action: () => {
        if (documents.length <= 1) return;
        const currentIndex = documents.findIndex(doc => doc.id === activeDocumentId);
        const nextIndex = (currentIndex + 1) % documents.length;
        setActiveDocument(documents[nextIndex].id);
      },
      description: 'Next Tab',
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      action: () => {
        if (documents.length <= 1) return;
        const currentIndex = documents.findIndex(doc => doc.id === activeDocumentId);
        const prevIndex = currentIndex - 1 < 0 ? documents.length - 1 : currentIndex - 1;
        setActiveDocument(documents[prevIndex].id);
      },
      description: 'Previous Tab',
    },
    // Ctrl+1 through Ctrl+9 to go to specific tab
    {
      key: '1',
      ctrl: true,
      action: () => {
        if (documents.length >= 1) setActiveDocument(documents[0].id);
      },
      description: 'Go to Tab 1',
    },
    {
      key: '2',
      ctrl: true,
      action: () => {
        if (documents.length >= 2) setActiveDocument(documents[1].id);
      },
      description: 'Go to Tab 2',
    },
    {
      key: '3',
      ctrl: true,
      action: () => {
        if (documents.length >= 3) setActiveDocument(documents[2].id);
      },
      description: 'Go to Tab 3',
    },
    {
      key: '4',
      ctrl: true,
      action: () => {
        if (documents.length >= 4) setActiveDocument(documents[3].id);
      },
      description: 'Go to Tab 4',
    },
    {
      key: '5',
      ctrl: true,
      action: () => {
        if (documents.length >= 5) setActiveDocument(documents[4].id);
      },
      description: 'Go to Tab 5',
    },
    {
      key: '6',
      ctrl: true,
      action: () => {
        if (documents.length >= 6) setActiveDocument(documents[5].id);
      },
      description: 'Go to Tab 6',
    },
    {
      key: '7',
      ctrl: true,
      action: () => {
        if (documents.length >= 7) setActiveDocument(documents[6].id);
      },
      description: 'Go to Tab 7',
    },
    {
      key: '8',
      ctrl: true,
      action: () => {
        if (documents.length >= 8) setActiveDocument(documents[7].id);
      },
      description: 'Go to Tab 8',
    },
    {
      key: '9',
      ctrl: true,
      action: () => {
        if (documents.length >= 9) setActiveDocument(documents[8].id);
      },
      description: 'Go to Tab 9',
    },
  ]);

  // Restore session on app launch
  useEffect(() => {
    // Only run once on mount
    const session = SessionService.loadSession();

    if (session && session.documents.length > 0 && !SessionService.isSessionExpired()) {
      // Restore documents and active document
      restoreSession(session.documents, session.activeDocumentId);

      // Restore UI settings
      if (session.uiState) {
        setTheme(session.uiState.theme);
        setFontSize(session.uiState.fontSize);
      }

      showNotification('Session restored', 'success');
    } else {
      // No valid session, create welcome document
      const welcomeDoc: OpenDocument = {
        id: generateId(),
        path: '',
        source: 'temp',
        encrypted: false,
        content: `Welcome to SecureTextEditor! 🔐

This is a secure, encrypted text editor for Android and Windows.

Features Available:
• Multi-tab document editing with keyboard shortcuts
• Tab navigation (Ctrl+Tab, Ctrl+1-9)
• Session persistence (auto-restore on launch)
• 6 beautiful themes (Light, Dark, Solarized, Dracula, Nord)
• Persistent settings
• Real-time character and line counting

Coming Soon:
• AES-256-GCM encryption
• Google Drive integration
• Local file operations
• Auto-save functionality
• Cross-platform deployment

Start typing to edit this document...`,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          created: formatDate(),
          modified: formatDate(),
          filename: 'Welcome.txt',
        },
      };
      addDocument(welcomeDoc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Save session whenever state changes
  useEffect(() => {
    // Don't save if there are no documents (initial state)
    if (documents.length === 0) return;

    const saveSession = () => {
      SessionService.saveSession({
        documents,
        activeDocumentId,
        uiState: {
          theme,
          fontSize,
          statusBar,
        },
      });
    };

    // Debounce session saves to avoid excessive writes
    const timeoutId = setTimeout(saveSession, 500);
    return () => clearTimeout(timeoutId);
  }, [documents, activeDocumentId, theme, fontSize, statusBar]);

  // Save session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (documents.length > 0) {
        SessionService.saveSession({
          documents,
          activeDocumentId,
          uiState: {
            theme,
            fontSize,
            statusBar,
          },
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [documents, activeDocumentId, theme, fontSize, statusBar]);

  // Restore cursor and scroll position when switching documents
  useEffect(() => {
    if (editorRef.current && activeDoc) {
      // Restore cursor position
      const cursorPos = activeDoc.cursorPosition || 0;
      editorRef.current.setSelectionRange(cursorPos, cursorPos);

      // Restore scroll position
      editorRef.current.scrollTop = activeDoc.scrollPosition || 0;

      // Update cursor info display
      const pos = getCursorPosition(editorRef.current);
      setCursorInfo(pos);

      // Focus the editor
      editorRef.current.focus();
    }
    // Only restore when switching documents (activeDocumentId changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocumentId]);

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeDocumentId) {
      updateContent(activeDocumentId, e.target.value);
    }
  };

  // Update cursor position
  const handleCursorMove = () => {
    if (editorRef.current && activeDocumentId) {
      const pos = getCursorPosition(editorRef.current);
      setCursorInfo(pos);

      // Save cursor position to document
      const selectionStart = editorRef.current.selectionStart;
      updateDocument(activeDocumentId, { cursorPosition: selectionStart });
    }
  };

  // Handle scroll position changes
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (activeDocumentId) {
      const scrollTop = e.currentTarget.scrollTop;
      updateDocument(activeDocumentId, { scrollPosition: scrollTop });
    }
  };

  // Cycle through themes (for demo)
  const cycleTheme = () => {
    const themes = ['light', 'dark', 'solarizedLight', 'solarizedDark', 'dracula', 'nord'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const charCount = activeDoc ? countCharacters(activeDoc.content) : 0;
  const lineCount = activeDoc ? activeDoc.content.split('\n').length : 0;

  return (
    <div className="app">
      <HamburgerMenu />
      <Notification />

      <header className="header">
        <div className="toolbar">
          <button
            className="menu-button"
            onClick={() => toggleMenu('hamburgerMenu')}
            title="Menu (or try Ctrl+N for new doc)"
          >
            ☰
          </button>
          <h1 className="app-title">SecureTextEditor</h1>
          <div className="toolbar-actions">
            <button
              className="icon-button"
              title="Search (Ctrl+F)"
              onClick={() => showNotification('Search coming soon!', 'info')}
            >
              🔍
            </button>
            <button
              className="icon-button"
              onClick={cycleTheme}
              title={`Current: ${theme} (Click to change or use View menu)`}
            >
              🎨
            </button>
            <button
              className="icon-button"
              title="Settings"
              onClick={() => showNotification('Settings dialog coming soon!', 'info')}
            >
              ⚙️
            </button>
            <button
              className="icon-button"
              title="Help"
              onClick={() => showNotification('Help system coming soon!', 'info')}
            >
              ❓
            </button>
          </div>
        </div>
      </header>

      <EditorTabs />

      <main className="main-content">
        <div className="editor-container">
          <textarea
            ref={editorRef}
            className="editor"
            style={{ fontSize: `${fontSize}px` }}
            placeholder="Start typing... (Try Ctrl+N for new document, or click the ☰ menu)"
            value={activeDoc?.content || ''}
            onChange={handleContentChange}
            onKeyUp={handleCursorMove}
            onClick={handleCursorMove}
            onScroll={handleScroll}
          />
        </div>
      </main>

      {statusBar && (
        <footer className="status-bar">
          <span>
            Line: {cursorInfo.line} | Col: {cursorInfo.column} | {charCount} chars |{' '}
            {lineCount} lines | {activeDoc?.metadata.filename || 'Untitled'}{' '}
            {activeDoc?.modified ? '●' : ''}
          </span>
        </footer>
      )}
    </div>
  );
};

export default App;
