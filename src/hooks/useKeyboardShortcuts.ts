import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Predefined shortcuts configuration
export const defaultShortcuts = {
  // File operations
  NEW_DOCUMENT: { key: 'n', ctrl: true, description: 'New Document' },
  OPEN_FILE: { key: 'o', ctrl: true, description: 'Open File' },
  OPEN_DRIVE: { key: 'o', ctrl: true, shift: true, description: 'Open from Drive' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  SAVE_AS: { key: 's', ctrl: true, shift: true, description: 'Save As' },
  SAVE_ALL: { key: 's', ctrl: true, alt: true, description: 'Save All' },
  CLOSE_TAB: { key: 'w', ctrl: true, description: 'Close Tab' },

  // Edit operations
  UNDO: { key: 'z', ctrl: true, description: 'Undo' },
  REDO: { key: 'y', ctrl: true, description: 'Redo' },
  CUT: { key: 'x', ctrl: true, description: 'Cut' },
  COPY: { key: 'c', ctrl: true, description: 'Copy' },
  PASTE: { key: 'v', ctrl: true, description: 'Paste' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Select All' },
  FIND: { key: 'f', ctrl: true, description: 'Find' },
  REPLACE: { key: 'h', ctrl: true, description: 'Find and Replace' },
  FIND_ALL: { key: 'f', ctrl: true, shift: true, description: 'Find in All Tabs' },

  // View operations
  ZOOM_IN: { key: '=', ctrl: true, description: 'Zoom In' },
  ZOOM_OUT: { key: '-', ctrl: true, description: 'Zoom Out' },
  RESET_ZOOM: { key: '0', ctrl: true, description: 'Reset Zoom' },

  // Tab navigation
  NEXT_TAB: { key: 'Tab', ctrl: true, description: 'Next Tab' },
  PREV_TAB: { key: 'Tab', ctrl: true, shift: true, description: 'Previous Tab' },
};
