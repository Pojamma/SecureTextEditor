import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { convertToUpperCase, convertToLowerCase, convertToTitleCase } from '@/utils/textUtils';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const convertCaseSubmenuRef = useRef<HTMLDivElement>(null);
  const { editorActions, showNotification } = useUIStore();
  const [showConvertCaseSubmenu, setShowConvertCaseSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners after a brief delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleAction = async (action: (() => void | Promise<void>) | undefined, actionName: string) => {
    if (action) {
      await action();
      onClose();
    } else {
      showNotification(`${actionName} not available`, 'warning');
      onClose();
    }
  };

  const calculateSubmenuPosition = (triggerRef: React.RefObject<HTMLDivElement>) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right - 2, // Slight overlap to prevent gap
      });
    }
  };

  const handleSubmenuMouseEnter = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }
    setShowConvertCaseSubmenu(true);
    calculateSubmenuPosition(convertCaseSubmenuRef);
  };

  const handleSubmenuMouseLeave = () => {
    submenuTimeoutRef.current = setTimeout(() => {
      setShowConvertCaseSubmenu(false);
    }, 150);
  };

  const handleConvertCase = (type: 'upper' | 'lower' | 'title') => {
    if (!editorActions.getSelectedText || !editorActions.replaceSelectedText) {
      showNotification('Convert case not available', 'warning');
      onClose();
      return;
    }

    const selectedText = editorActions.getSelectedText();

    if (!selectedText) {
      showNotification('No text selected', 'warning');
      onClose();
      return;
    }

    let converted = selectedText;
    if (type === 'upper') {
      converted = convertToUpperCase(selectedText);
    } else if (type === 'lower') {
      converted = convertToLowerCase(selectedText);
    } else if (type === 'title') {
      converted = convertToTitleCase(selectedText);
    }

    editorActions.replaceSelectedText(converted);
    showNotification(`Converted to ${type} case`, 'success');
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
    >
      <button
        className="context-menu-item"
        onClick={() => handleAction(editorActions.undo, 'Undo')}
      >
        <span>Undo</span>
        <span className="context-menu-shortcut">Ctrl+Z</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => handleAction(editorActions.redo, 'Redo')}
      >
        <span>Redo</span>
        <span className="context-menu-shortcut">Ctrl+Y</span>
      </button>
      <div className="context-menu-separator" />
      <button
        className="context-menu-item"
        onClick={() => handleAction(editorActions.cut, 'Cut')}
      >
        <span>Cut</span>
        <span className="context-menu-shortcut">Ctrl+X</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => handleAction(editorActions.copy, 'Copy')}
      >
        <span>Copy</span>
        <span className="context-menu-shortcut">Ctrl+C</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => handleAction(editorActions.paste, 'Paste')}
      >
        <span>Paste</span>
        <span className="context-menu-shortcut">Ctrl+V</span>
      </button>
      <div className="context-menu-separator" />
      <button
        className="context-menu-item"
        onClick={() => handleAction(editorActions.selectAll, 'Select All')}
      >
        <span>Select All</span>
        <span className="context-menu-shortcut">Ctrl+A</span>
      </button>
      <div className="context-menu-separator" />

      {/* Convert Case Submenu */}
      <div
        ref={convertCaseSubmenuRef}
        className="context-menu-item context-menu-item-submenu"
        onMouseEnter={handleSubmenuMouseEnter}
        onMouseLeave={handleSubmenuMouseLeave}
      >
        <span>Convert Case</span>
        <span className="context-menu-arrow">▶</span>
        {showConvertCaseSubmenu && (
          <div
            className="context-submenu-content"
            style={{ top: submenuPosition.top, left: submenuPosition.left }}
            onMouseEnter={() => {
              if (submenuTimeoutRef.current) {
                clearTimeout(submenuTimeoutRef.current);
                submenuTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleSubmenuMouseLeave}
          >
            <button className="context-menu-item" onClick={() => handleConvertCase('upper')}>
              <span>UPPERCASE</span>
            </button>
            <button className="context-menu-item" onClick={() => handleConvertCase('lower')}>
              <span>lowercase</span>
            </button>
            <button className="context-menu-item" onClick={() => handleConvertCase('title')}>
              <span>Title Case</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
