import React, { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateId, formatDate } from '@/utils/helpers';
import { OpenDocument } from '@/types/document.types';
import { saveFile, saveExternalFile } from '@/services/filesystem.service';
import './HeaderDropdownMenus.css';

type MenuType = 'file' | 'edit' | 'more' | null;

export const HeaderDropdownMenus: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { addDocument, updateDocument, getActiveDocument } = useDocumentStore();
  const { editorActions, showNotification, openDialog, showSearchAllTabs } = useUIStore();
  const { toggleStatusBar, toggleSpecialChars, specialCharsVisible } = useSettingsStore();

  const activeDoc = getActiveDocument();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenu]);

  const toggleMenu = (menu: MenuType) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setOpenMenu(null);
  };

  const handleAction = (action: (() => void) | undefined, actionName: string) => {
    if (action) {
      action();
      closeMenu();
    } else {
      console.warn(`${actionName} action not available`);
      closeMenu();
    }
  };

  // File menu actions
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
    showNotification('New document created', 'success');
    closeMenu();
  };

  const handleSave = async () => {
    if (!activeDoc) {
      showNotification('No document to save', 'info');
      closeMenu();
      return;
    }

    try {
      if (activeDoc.source === 'temp' || !activeDoc.path) {
        showNotification('Use File → Save As to save new documents', 'info');
        closeMenu();
        return;
      }

      if (activeDoc.encrypted) {
        showNotification('Use File → Save for encrypted files (password required)', 'info');
        closeMenu();
        return;
      }

      if (activeDoc.source === 'external') {
        await saveExternalFile(activeDoc);
        updateDocument(activeDoc.id, { modified: false });
        showNotification(`Saved "${activeDoc.metadata.filename}"`, 'success');
        closeMenu();
        return;
      }

      await saveFile(activeDoc);
      updateDocument(activeDoc.id, { modified: false });
      showNotification(`Saved "${activeDoc.metadata.filename}"`, 'success');
      closeMenu();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
      closeMenu();
    }
  };

  return (
    <div className="header-dropdown-menus" ref={menuRef}>
      {/* File Menu */}
      <div className="dropdown-menu-container">
        <button
          type="button"
          className={`dropdown-menu-button ${openMenu === 'file' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu('file');
          }}
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="dropdown-menu-content">
            <button className="dropdown-menu-item" onClick={handleNewDocument}>
              <span>New</span>
              <span className="dropdown-menu-shortcut">Ctrl+N</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => { openDialog('filePickerDialog'); closeMenu(); }}>
              <span>Open Local File...</span>
            </button>
            <button className="dropdown-menu-item" onClick={handleSave}>
              <span>Save</span>
              <span className="dropdown-menu-shortcut">Ctrl+S</span>
            </button>
            <div className="dropdown-menu-separator" />
            <button className="dropdown-menu-item" onClick={() => { openDialog('statisticsDialog'); closeMenu(); }}>
              <span>Statistics</span>
              <span className="dropdown-menu-shortcut">Ctrl+I</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="dropdown-menu-container">
        <button
          type="button"
          className={`dropdown-menu-button ${openMenu === 'edit' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu('edit');
          }}
        >
          Edit
        </button>
        {openMenu === 'edit' && (
          <div className="dropdown-menu-content">
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.undo, 'Undo')}>
              <span>Undo</span>
              <span className="dropdown-menu-shortcut">Ctrl+Z</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.redo, 'Redo')}>
              <span>Redo</span>
              <span className="dropdown-menu-shortcut">Ctrl+Y</span>
            </button>
            <div className="dropdown-menu-separator" />
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.cut, 'Cut')}>
              <span>Cut</span>
              <span className="dropdown-menu-shortcut">Ctrl+X</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.copy, 'Copy')}>
              <span>Copy</span>
              <span className="dropdown-menu-shortcut">Ctrl+C</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.paste, 'Paste')}>
              <span>Paste</span>
              <span className="dropdown-menu-shortcut">Ctrl+V</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.selectAll, 'Select All')}>
              <span>Select All</span>
              <span className="dropdown-menu-shortcut">Ctrl+A</span>
            </button>
            <div className="dropdown-menu-separator" />
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.find, 'Find')}>
              <span>Find</span>
              <span className="dropdown-menu-shortcut">Ctrl+F</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.findAndReplace, 'Find and Replace')}>
              <span>Find and Replace</span>
              <span className="dropdown-menu-shortcut">Ctrl+H</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => { showSearchAllTabs(); closeMenu(); }}>
              <span>Find in All Tabs</span>
              <span className="dropdown-menu-shortcut">Ctrl+Shift+F</span>
            </button>
          </div>
        )}
      </div>

      {/* More Menu */}
      <div className="dropdown-menu-container">
        <button
          type="button"
          className={`dropdown-menu-button ${openMenu === 'more' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu('more');
          }}
        >
          More
        </button>
        {openMenu === 'more' && (
          <div className="dropdown-menu-content">
            <button className="dropdown-menu-item" onClick={() => { openDialog('specialCharDialog'); closeMenu(); }}>
              <span>Insert Special Character</span>
              <span className="dropdown-menu-shortcut">F3</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => { toggleSpecialChars(); closeMenu(); }}>
              <span>{specialCharsVisible ? 'Hide' : 'Show'} Special Chars Bar</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => { toggleStatusBar(); closeMenu(); }}>
              <span>Toggle Status Bar</span>
            </button>
            <div className="dropdown-menu-separator" />
            <button className="dropdown-menu-item" onClick={() => { openDialog('settingsDialog'); closeMenu(); }}>
              <span>Settings</span>
            </button>
            <button className="dropdown-menu-item" onClick={() => { openDialog('helpDialog'); closeMenu(); }}>
              <span>Help</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
