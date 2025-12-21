import React, { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from './stores/documentStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { generateId, formatDate, getCursorPosition, countCharacters } from './utils/helpers';
import { OpenDocument } from './types/document.types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { HamburgerMenu } from './components/Menus/HamburgerMenu';
import { Notification } from './components/Notification';
import './App.css';

const App: React.FC = () => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1 });

  // Store hooks
  const { documents, activeDocumentId, addDocument, updateContent, getActiveDocument, closeDocument } =
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
        if (documents.length > 0 && documents[0]) {
          closeDocument(documents[0].id);
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
  ]);

  // Initialize with a welcome document
  useEffect(() => {
    if (documents.length === 0) {
      const welcomeDoc: OpenDocument = {
        id: generateId(),
        path: '',
        source: 'temp',
        encrypted: false,
        content: `Welcome to SecureTextEditor! 🔐

This is a secure, encrypted text editor for Android and Windows.

Current Theme: ${theme} (Try changing it from the menu!)

Features Available:
• Multi-tab document editing
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
  }, [documents.length, addDocument, theme]);

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeDocumentId) {
      updateContent(activeDocumentId, e.target.value);
    }
  };

  // Update cursor position
  const handleCursorMove = () => {
    if (editorRef.current) {
      const pos = getCursorPosition(editorRef.current);
      setCursorInfo(pos);
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
