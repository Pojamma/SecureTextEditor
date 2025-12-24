import React from 'react';
import { useKeyboard } from '../hooks/useKeyboard';
import './KeyboardAccessoryBar.css';

interface KeyboardAccessoryBarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onInsertTab?: () => void;
  onSearchToggle?: () => void;
}

/**
 * Keyboard accessory bar for mobile devices
 * Provides quick access to common editing actions above the keyboard
 */
export const KeyboardAccessoryBar: React.FC<KeyboardAccessoryBarProps> = ({
  onUndo,
  onRedo,
  onInsertTab,
  onSearchToggle,
}) => {
  const { isVisible, hide, isNativePlatform } = useKeyboard();

  // Only show on native platforms when keyboard is visible
  if (!isNativePlatform || !isVisible) {
    return null;
  }

  return (
    <div className="keyboard-accessory-bar">
      <div className="accessory-bar-actions">
        {onUndo && (
          <button
            className="accessory-button"
            onClick={onUndo}
            title="Undo"
            aria-label="Undo"
          >
            ↶
          </button>
        )}
        {onRedo && (
          <button
            className="accessory-button"
            onClick={onRedo}
            title="Redo"
            aria-label="Redo"
          >
            ↷
          </button>
        )}
        {onInsertTab && (
          <button
            className="accessory-button"
            onClick={onInsertTab}
            title="Insert Tab"
            aria-label="Insert Tab"
          >
            ⇥
          </button>
        )}
        {onSearchToggle && (
          <button
            className="accessory-button"
            onClick={onSearchToggle}
            title="Search"
            aria-label="Search"
          >
            🔍
          </button>
        )}
      </div>
      <button
        className="accessory-button dismiss-button"
        onClick={hide}
        title="Hide Keyboard"
        aria-label="Hide Keyboard"
      >
        ✕
      </button>
    </div>
  );
};
