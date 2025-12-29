import React, { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';

export const EditMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { closeAllMenus, showSearchAllTabs, editorActions } = useUIStore();

  const handleAction = (action: (() => void) | undefined, actionName: string) => {
    if (action) {
      action();
      closeAllMenus();
    } else {
      console.warn(`${actionName} action not available`);
    }
  };

  return (
    <div className="menu-section">
      <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
        <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
        <span className="menu-section-title">Edit</span>
      </div>

      {expanded && (
        <div className="menu-items">
          <button className="menu-item" onClick={() => handleAction(editorActions.undo, 'Undo')}>
            <span>Undo</span>
            <span className="menu-shortcut">Ctrl+Z</span>
          </button>

          <button className="menu-item" onClick={() => handleAction(editorActions.redo, 'Redo')}>
            <span>Redo</span>
            <span className="menu-shortcut">Ctrl+Y</span>
          </button>

          <div className="menu-separator" />

          <button className="menu-item" onClick={() => handleAction(editorActions.cut, 'Cut')}>
            <span>Cut</span>
            <span className="menu-shortcut">Ctrl+X</span>
          </button>

          <button className="menu-item" onClick={() => handleAction(editorActions.copy, 'Copy')}>
            <span>Copy</span>
            <span className="menu-shortcut">Ctrl+C</span>
          </button>

          <button className="menu-item" onClick={() => handleAction(editorActions.paste, 'Paste')}>
            <span>Paste</span>
            <span className="menu-shortcut">Ctrl+V</span>
          </button>

          <button className="menu-item" onClick={() => handleAction(editorActions.selectAll, 'Select All')}>
            <span>Select All</span>
            <span className="menu-shortcut">Ctrl+A</span>
          </button>

          <div className="menu-separator" />

          <button className="menu-item" onClick={() => handleAction(editorActions.find, 'Find')}>
            <span>Find</span>
            <span className="menu-shortcut">Ctrl+F</span>
          </button>

          <button className="menu-item" onClick={() => handleAction(editorActions.findAndReplace, 'Find and Replace')}>
            <span>Find and Replace</span>
            <span className="menu-shortcut">Ctrl+H</span>
          </button>

          <button className="menu-item" onClick={() => {
            showSearchAllTabs();
            closeAllMenus();
          }}>
            <span>Find in All Tabs</span>
            <span className="menu-shortcut">Ctrl+Shift+F</span>
          </button>
        </div>
      )}
    </div>
  );
};
