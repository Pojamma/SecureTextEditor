import React, { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from './stores/documentStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { generateId, formatDate, getCursorPosition, countCharacters } from './utils/helpers';
import { OpenDocument } from './types/document.types';
import './App.css';

const App: React.FC = () => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1 });

  // Store hooks
  const { documents, activeDocumentId, addDocument, updateContent, getActiveDocument } =
    useDocumentStore();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const { toggleMenu } = useUIStore();

  const activeDoc = getActiveDocument();

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
      <header className="header">
        <div className="toolbar">
          <button
            className="menu-button"
            onClick={() => toggleMenu('hamburgerMenu')}
            title="Menu"
          >
            ☰
          </button>
          <h1 className="app-title">SecureTextEditor</h1>
          <div className="toolbar-actions">
            <button className="icon-button" title="Search">
              🔍
            </button>
            <button
              className="icon-button"
              onClick={cycleTheme}
              title={`Current: ${theme} (Click to change)`}
            >
              🎨
            </button>
            <button className="icon-button" title="Settings">
              ⚙️
            </button>
            <button className="icon-button" title="Help">
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
            placeholder="Start typing..."
            value={activeDoc?.content || ''}
            onChange={handleContentChange}
            onKeyUp={handleCursorMove}
            onClick={handleCursorMove}
          />
        </div>
      </main>

      <footer className="status-bar">
        <span>
          Line: {cursorInfo.line} | Col: {cursorInfo.column} | {charCount} chars |{' '}
          {lineCount} lines | {activeDoc?.metadata.filename || 'Untitled'}{' '}
          {activeDoc?.modified ? '●' : ''}
        </span>
      </footer>
    </div>
  );
};

export default App;
