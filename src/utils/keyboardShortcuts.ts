/**
 * Keyboard shortcuts handler
 * Handles global keyboard shortcuts for the application
 */

export interface KeyboardShortcutHandler {
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onCloseTab?: () => void;
  onNewTab?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
}

export function handleKeyboardShortcut(
  event: KeyboardEvent,
  handlers: KeyboardShortcutHandler
): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
  const key = event.key.toLowerCase();

  // Ctrl/Cmd + S: Save
  if (ctrlKey && key === 's' && !event.shiftKey) {
    event.preventDefault();
    handlers.onSave?.();
    return true;
  }

  // Ctrl/Cmd + Shift + S: Save As
  if (ctrlKey && event.shiftKey && key === 's') {
    event.preventDefault();
    handlers.onSaveAs?.();
    return true;
  }

  // Ctrl/Cmd + O: Open
  if (ctrlKey && key === 'o') {
    event.preventDefault();
    handlers.onOpen?.();
    return true;
  }

  // Ctrl/Cmd + N: New
  if (ctrlKey && key === 'n') {
    event.preventDefault();
    handlers.onNew?.();
    return true;
  }

  // Ctrl/Cmd + F: Find
  if (ctrlKey && key === 'f') {
    event.preventDefault();
    handlers.onFind?.();
    return true;
  }

  // Ctrl/Cmd + H: Replace
  if (ctrlKey && key === 'h') {
    event.preventDefault();
    handlers.onReplace?.();
    return true;
  }

  // Ctrl/Cmd + Z: Undo
  if (ctrlKey && key === 'z' && !event.shiftKey) {
    event.preventDefault();
    handlers.onUndo?.();
    return true;
  }

  // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
  if ((ctrlKey && event.shiftKey && key === 'z') || (ctrlKey && key === 'y')) {
    event.preventDefault();
    handlers.onRedo?.();
    return true;
  }

  // Ctrl/Cmd + A: Select All
  if (ctrlKey && key === 'a') {
    event.preventDefault();
    handlers.onSelectAll?.();
    return true;
  }

  // Ctrl/Cmd + B: Bold
  if (ctrlKey && key === 'b') {
    event.preventDefault();
    handlers.onBold?.();
    return true;
  }

  // Ctrl/Cmd + I: Italic
  if (ctrlKey && key === 'i') {
    event.preventDefault();
    handlers.onItalic?.();
    return true;
  }

  // Ctrl/Cmd + W: Close Tab
  if (ctrlKey && key === 'w') {
    event.preventDefault();
    handlers.onCloseTab?.();
    return true;
  }

  // Ctrl/Cmd + T: New Tab
  if (ctrlKey && key === 't') {
    event.preventDefault();
    handlers.onNewTab?.();
    return true;
  }

  // Ctrl/Cmd + Tab: Next Tab
  if (ctrlKey && key === 'tab' && !event.shiftKey) {
    event.preventDefault();
    handlers.onNextTab?.();
    return true;
  }

  // Ctrl/Cmd + Shift + Tab: Previous Tab
  if (ctrlKey && event.shiftKey && key === 'tab') {
    event.preventDefault();
    handlers.onPrevTab?.();
    return true;
  }

  return false;
}
