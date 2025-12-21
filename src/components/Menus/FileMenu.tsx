import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { generateId, formatDate } from '@/utils/helpers';
import { OpenDocument } from '@/types/document.types';

export const FileMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const { addDocument, closeDocument, closeAllDocuments, documents, hasUnsavedChanges } =
    useDocumentStore();
  const { closeAllMenus, showNotification } = useUIStore();

  const handleNewDocument = () => {
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
    closeAllMenus();
    showNotification('New document created', 'success');
  };

  const handleOpenLocal = () => {
    showNotification('Local file opening coming soon!', 'info');
    closeAllMenus();
  };

  const handleOpenDrive = () => {
    showNotification('Google Drive integration coming soon!', 'info');
    closeAllMenus();
  };

  const handleSave = () => {
    showNotification('Save functionality coming soon!', 'info');
    closeAllMenus();
  };

  const handleSaveAs = () => {
    showNotification('Save As functionality coming soon!', 'info');
    closeAllMenus();
  };

  const handleSaveAll = () => {
    showNotification('Save All functionality coming soon!', 'info');
    closeAllMenus();
  };

  const handleCloseTab = () => {
    if (documents.length > 0 && documents[0]) {
      closeDocument(documents[0].id);
      showNotification('Tab closed', 'info');
    }
    closeAllMenus();
  };

  const handleCloseAll = () => {
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Close all tabs anyway?')) {
        closeAllDocuments();
        showNotification('All tabs closed', 'info');
      }
    } else {
      closeAllDocuments();
      showNotification('All tabs closed', 'info');
    }
    closeAllMenus();
  };

  return (
    <div className="menu-section">
      <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
        <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
        <span className="menu-section-title">File</span>
      </div>

      {expanded && (
        <div className="menu-items">
          <button className="menu-item" onClick={handleNewDocument}>
            <span>New Document</span>
            <span className="menu-shortcut">Ctrl+N</span>
          </button>

          <button className="menu-item" onClick={handleOpenLocal}>
            <span>Open Local File</span>
            <span className="menu-shortcut">Ctrl+O</span>
          </button>

          <button className="menu-item" onClick={handleOpenDrive}>
            <span>Open from Google Drive</span>
            <span className="menu-shortcut">Ctrl+Shift+O</span>
          </button>

          <div className="menu-separator" />

          <button className="menu-item" onClick={handleSave}>
            <span>Save</span>
            <span className="menu-shortcut">Ctrl+S</span>
          </button>

          <button className="menu-item" onClick={handleSaveAs}>
            <span>Save As</span>
            <span className="menu-shortcut">Ctrl+Shift+S</span>
          </button>

          <button className="menu-item" onClick={handleSaveAll}>
            <span>Save All</span>
            <span className="menu-shortcut">Ctrl+Alt+S</span>
          </button>

          <div className="menu-separator" />

          <button className="menu-item" onClick={handleCloseTab}>
            <span>Close Tab</span>
            <span className="menu-shortcut">Ctrl+W</span>
          </button>

          <button className="menu-item" onClick={handleCloseAll}>
            <span>Close All Tabs</span>
          </button>
        </div>
      )}
    </div>
  );
};
