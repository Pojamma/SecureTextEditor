import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import './Menu.css';

export const InsertMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [dateTimeExpanded, setDateTimeExpanded] = useState(false);

  const { getActiveDocument, updateDocument } = useDocumentStore();
  const { closeAllMenus, showNotification, openDialog } = useUIStore();

  const activeDocument = getActiveDocument();

  // Insert current date in various formats
  const handleInsertDate = (format: 'short' | 'long' | 'iso' | 'time' | 'datetime') => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }

    const now = new Date();
    let dateString = '';

    switch (format) {
      case 'short':
        // MM/DD/YYYY
        dateString = now.toLocaleDateString('en-US');
        break;
      case 'long':
        // Month DD, YYYY
        dateString = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        break;
      case 'iso':
        // YYYY-MM-DD
        dateString = now.toISOString().split('T')[0];
        break;
      case 'time':
        // HH:MM AM/PM
        dateString = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        break;
      case 'datetime':
        // MM/DD/YYYY HH:MM AM/PM
        dateString = `${now.toLocaleDateString('en-US')} ${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
        break;
    }

    // Insert at the end of the document for now
    // In a future enhancement, we could insert at cursor position
    const newContent = activeDocument.content + dateString;
    updateDocument(activeDocument.id, { content: newContent });
    showNotification('Date/time inserted', 'success');
    closeAllMenus();
  };

  const handleInsertSpecialChar = () => {
    openDialog('specialCharDialog');
    closeAllMenus();
  };

  return (
    <div className="menu-section">
      <button
        className="menu-section-title"
        onClick={() => setExpanded(!expanded)}
      >
        Insert
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
      </button>
      {expanded && (
        <div className="menu-section-content">
          <div className="menu-item menu-item-submenu">
            <button
              className="submenu-trigger"
              onClick={() => setDateTimeExpanded(!dateTimeExpanded)}
            >
              <span>Date and Time</span>
              <span className={`menu-item-icon ${dateTimeExpanded ? 'expanded' : ''}`}>▶</span>
            </button>
            {dateTimeExpanded && (
              <div className="submenu">
                <button className="menu-item" onClick={() => handleInsertDate('short')}>
                  <span>Date (MM/DD/YYYY)</span>
                </button>
                <button className="menu-item" onClick={() => handleInsertDate('long')}>
                  <span>Date (Month DD, YYYY)</span>
                </button>
                <button className="menu-item" onClick={() => handleInsertDate('iso')}>
                  <span>Date (YYYY-MM-DD)</span>
                </button>
                <button className="menu-item" onClick={() => handleInsertDate('time')}>
                  <span>Time (HH:MM AM/PM)</span>
                </button>
                <button className="menu-item" onClick={() => handleInsertDate('datetime')}>
                  <span>Date & Time</span>
                </button>
              </div>
            )}
          </div>

          <div className="menu-divider"></div>

          <button className="menu-item" onClick={handleInsertSpecialChar}>
            <span>Special Character...</span>
            <span className="menu-item-shortcut">F3</span>
          </button>
        </div>
      )}
    </div>
  );
};
