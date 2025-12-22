import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { exportAsText, exportAsHTML, shareDocument, copyToClipboard } from '@/utils/exportUtils';
import './Menu.css';

export const ExportMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  const { getActiveDocument } = useDocumentStore();
  const { closeAllMenus, showNotification } = useUIStore();

  const activeDocument = getActiveDocument();

  const handleExportText = () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      exportAsText(activeDocument.metadata.filename, activeDocument.content);
      showNotification('Document exported as text file', 'success');
      closeAllMenus();
    } catch (error) {
      showNotification('Failed to export document', 'error');
    }
  };

  const handleExportHTML = () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      exportAsHTML(activeDocument.metadata.filename, activeDocument.content);
      showNotification('Document exported as HTML file', 'success');
      closeAllMenus();
    } catch (error) {
      showNotification('Failed to export as HTML', 'error');
    }
  };

  const handleShare = async () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      const shared = await shareDocument(
        activeDocument.metadata.filename,
        activeDocument.content
      );

      if (shared) {
        showNotification('Document shared', 'success');
      }
      // If not shared, user likely cancelled - no notification needed
      closeAllMenus();
    } catch (error) {
      showNotification('Failed to share document', 'error');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      await copyToClipboard(activeDocument.content);
      showNotification('Content copied to clipboard', 'success');
      closeAllMenus();
    } catch (error) {
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  return (
    <div className="menu-section">
      <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
        <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
        <span className="menu-section-title">Export</span>
      </div>
      {expanded && (
        <div className="menu-items">
          <button className="menu-item" onClick={handleExportText}>
            <span>Export as Text (.txt)</span>
          </button>

          <button className="menu-item" onClick={handleExportHTML}>
            <span>Export as HTML</span>
          </button>

          <div className="menu-divider"></div>

          <button className="menu-item" onClick={handleShare}>
            <span>Share Document...</span>
            <span className="menu-item-shortcut">Ctrl+Shift+S</span>
          </button>

          <button className="menu-item" onClick={handleCopyToClipboard}>
            <span>Copy to Clipboard</span>
            <span className="menu-item-shortcut">Ctrl+Shift+C</span>
          </button>
        </div>
      )}
    </div>
  );
};
