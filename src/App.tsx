import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="header">
        <div className="toolbar">
          <button className="menu-button">☰</button>
          <h1 className="app-title">SecureTextEditor</h1>
          <div className="toolbar-actions">
            <button className="icon-button" title="Search">🔍</button>
            <button className="icon-button" title="Settings">⚙️</button>
            <button className="icon-button" title="Help">❓</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-container">
          <textarea
            className="editor"
            placeholder="Start typing..."
            defaultValue="Welcome to SecureTextEditor! 🔐

This is a secure, encrypted text editor for Android and Windows.

Features coming soon:
• AES-256-GCM encryption
• Google Drive integration
• Multi-tab support
• Session persistence
• Cross-platform support

Start typing to edit this document..."
          />
        </div>
      </main>

      <footer className="status-bar">
        <span>Line: 1 | Col: 1 | 0 chars | UTF-8</span>
      </footer>
    </div>
  );
};

export default App;
