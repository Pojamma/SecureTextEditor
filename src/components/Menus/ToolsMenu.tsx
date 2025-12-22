import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import {
  sortLines,
  removeDuplicateLines,
  convertToUpperCase,
  convertToLowerCase,
  convertToTitleCase,
  trimWhitespace,
  removeEmptyLines,
} from '@/utils/textUtils';
import './Menu.css';

export const ToolsMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [caseExpanded, setCaseExpanded] = useState(false);

  const { getActiveDocument, updateDocument } = useDocumentStore();
  const { closeAllMenus, showNotification, openDialog } = useUIStore();

  const activeDocument = getActiveDocument();

  const handleShowStatistics = () => {
    openDialog('statisticsDialog');
    closeAllMenus();
  };

  const handleSortLines = () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }
    const sorted = sortLines(activeDocument.content);
    updateDocument(activeDocument.id, { content: sorted });
    showNotification('Lines sorted alphabetically', 'success');
    closeAllMenus();
  };

  const handleRemoveDuplicates = () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }
    const deduplicated = removeDuplicateLines(activeDocument.content);
    updateDocument(activeDocument.id, { content: deduplicated });
    showNotification('Duplicate lines removed', 'success');
    closeAllMenus();
  };

  const handleConvertCase = (type: 'upper' | 'lower' | 'title') => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }
    let converted = activeDocument.content;
    if (type === 'upper') {
      converted = convertToUpperCase(activeDocument.content);
    } else if (type === 'lower') {
      converted = convertToLowerCase(activeDocument.content);
    } else if (type === 'title') {
      converted = convertToTitleCase(activeDocument.content);
    }
    updateDocument(activeDocument.id, { content: converted });
    showNotification(`Converted to ${type} case`, 'success');
    closeAllMenus();
  };

  const handleTrimWhitespace = () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }
    const trimmed = trimWhitespace(activeDocument.content);
    updateDocument(activeDocument.id, { content: trimmed });
    showNotification('Whitespace trimmed', 'success');
    closeAllMenus();
  };

  const handleRemoveEmptyLines = () => {
    if (!activeDocument) {
      showNotification('No active document', 'warning');
      return;
    }
    const cleaned = removeEmptyLines(activeDocument.content);
    updateDocument(activeDocument.id, { content: cleaned });
    showNotification('Empty lines removed', 'success');
    closeAllMenus();
  };

  return (
    <div className="menu-section">
      <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
        <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
        <span className="menu-section-title">Tools</span>
      </div>
      {expanded && (
        <div className="menu-items">
          <button className="menu-item" onClick={handleShowStatistics}>
            <span>Statistics</span>
            <span className="menu-item-shortcut">Ctrl+I</span>
          </button>

          <div className="menu-divider"></div>

          <button className="menu-item" onClick={handleSortLines}>
            <span>Sort Lines</span>
          </button>

          <button className="menu-item" onClick={handleRemoveDuplicates}>
            <span>Remove Duplicates</span>
          </button>

          <div className="menu-divider"></div>

          <div className="menu-item menu-item-submenu">
            <button
              className="submenu-trigger"
              onClick={() => setCaseExpanded(!caseExpanded)}
            >
              <span>Convert Case</span>
              <span className={`menu-item-icon ${caseExpanded ? 'expanded' : ''}`}>▶</span>
            </button>
            {caseExpanded && (
              <div className="submenu">
                <button className="menu-item" onClick={() => handleConvertCase('upper')}>
                  <span>UPPERCASE</span>
                </button>
                <button className="menu-item" onClick={() => handleConvertCase('lower')}>
                  <span>lowercase</span>
                </button>
                <button className="menu-item" onClick={() => handleConvertCase('title')}>
                  <span>Title Case</span>
                </button>
              </div>
            )}
          </div>

          <div className="menu-divider"></div>

          <button className="menu-item" onClick={handleTrimWhitespace}>
            <span>Trim Whitespace</span>
          </button>

          <button className="menu-item" onClick={handleRemoveEmptyLines}>
            <span>Remove Empty Lines</span>
          </button>
        </div>
      )}
    </div>
  );
};
