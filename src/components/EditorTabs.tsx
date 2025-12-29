import React, { useRef, useEffect } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useUIStore } from '../stores/uiStore';
import { generateId, formatDate } from '../utils/helpers';
import { OpenDocument } from '../types/document.types';
import { saveFile, saveExternalFile } from '../services/filesystem.service';
import './EditorTabs.css';

export const EditorTabs: React.FC = () => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const { documents, activeDocumentId, addDocument, setActiveDocument, closeDocument, updateDocument } =
    useDocumentStore();
  const { showNotification, showConfirmDialog } = useUIStore();

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (tabsContainerRef.current && activeDocumentId) {
      const activeTab = tabsContainerRef.current.querySelector('.tab.active');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeDocumentId]);

  const handleNewTab = () => {
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
  };

  const handleTabClick = (documentId: string) => {
    setActiveDocument(documentId);
  };

  const handleCloseTab = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation(); // Prevent tab activation when closing

    const doc = documents.find((d) => d.id === documentId);

    if (doc?.modified) {
      // Show confirmation dialog for unsaved changes
      showConfirmDialog({
        title: 'Unsaved Changes',
        message: `"${doc.metadata.filename}" has unsaved changes. Do you want to save before closing?`,
        confirmText: 'Save',
        cancelText: 'Cancel',
        showThirdOption: true,
        thirdOptionText: "Don't Save",
        onConfirm: async () => {
          // Save the document before closing
          try {
            // For temp files, user must use Save As
            if (doc.source === 'temp' || !doc.path) {
              showNotification('Use File → Save As to save new documents first', 'info');
              return;
            }

            // For encrypted files, user must use File → Save (requires password)
            if (doc.encrypted) {
              showNotification('Use File → Save for encrypted files (password required)', 'info');
              return;
            }

            // Save external file
            if (doc.source === 'external') {
              await saveExternalFile(doc);
              updateDocument(doc.id, { modified: false });
              showNotification(`Saved "${doc.metadata.filename}"`, 'success');
              closeDocument(documentId);
              return;
            }

            // Save regular file
            await saveFile(doc);
            updateDocument(doc.id, { modified: false });
            showNotification(`Saved "${doc.metadata.filename}"`, 'success');
            closeDocument(documentId);
          } catch (error) {
            showNotification(
              error instanceof Error ? error.message : 'Failed to save file',
              'error'
            );
          }
        },
        onCancel: () => {
          // Do nothing, just close the dialog
        },
        onThirdOption: () => {
          // Close without saving
          closeDocument(documentId);
          showNotification('Tab closed without saving', 'info');
        },
      });
    } else {
      closeDocument(documentId);
      showNotification('Tab closed', 'info');
    }
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="tabs-bar">
      <div className="tabs-container" ref={tabsContainerRef}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`tab ${doc.id === activeDocumentId ? 'active' : ''}`}
            onClick={() => handleTabClick(doc.id)}
            title={doc.path || doc.metadata.filename}
          >
            <span className="tab-icon">
              {doc.encrypted ? '🔒' : '📄'}
            </span>
            <span className="tab-name">
              {doc.metadata.filename}
              {doc.modified && <span className="modified-indicator">●</span>}
            </span>
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(e, doc.id)}
              title="Close tab"
              aria-label="Close tab"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        className="new-tab-button"
        onClick={handleNewTab}
        title="New document (Ctrl+N)"
        aria-label="New document"
      >
        +
      </button>
    </div>
  );
};
