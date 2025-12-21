import React, { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { themeNames } from '@/utils/themes';

export const ViewMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [fontExpanded, setFontExpanded] = useState(false);

  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    toggleSpecialChars,
    toggleLineNumbers,
    toggleStatusBar,
    specialCharsVisible,
    lineNumbers,
    statusBar,
  } = useSettingsStore();

  const { closeAllMenus, showNotification } = useUIStore();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    showNotification(`Theme changed to ${newTheme}`, 'success');
    closeAllMenus();
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    showNotification(`Font size changed to ${size}px`, 'success');
    closeAllMenus();
  };

  const handleZoom = (action: 'in' | 'out' | 'reset') => {
    if (action === 'in') {
      setFontSize(Math.min(fontSize + 2, 24));
    } else if (action === 'out') {
      setFontSize(Math.max(fontSize - 2, 8));
    } else {
      setFontSize(14);
    }
    closeAllMenus();
  };

  const themeDisplayNames: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    solarizedLight: 'Solarized Light',
    solarizedDark: 'Solarized Dark',
    dracula: 'Dracula',
    nord: 'Nord',
  };

  return (
    <div className="menu-section">
      <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
        <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
        <span className="menu-section-title">View</span>
      </div>

      {expanded && (
        <div className="menu-items">
          {/* Theme submenu */}
          <div className="menu-submenu">
            <button className="menu-item" onClick={() => setThemeExpanded(!themeExpanded)}>
              <span>Theme</span>
              <span className="menu-arrow">{themeExpanded ? '▼' : '▶'}</span>
            </button>
            {themeExpanded && (
              <div className="submenu-items">
                {themeNames.map((themeName) => (
                  <button
                    key={themeName}
                    className={`menu-item ${theme === themeName ? 'active' : ''}`}
                    onClick={() => handleThemeChange(themeName)}
                  >
                    <span>{themeDisplayNames[themeName] || themeName}</span>
                    {theme === themeName && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size submenu */}
          <div className="menu-submenu">
            <button className="menu-item" onClick={() => setFontExpanded(!fontExpanded)}>
              <span>Font Size</span>
              <span className="menu-arrow">{fontExpanded ? '▼' : '▶'}</span>
            </button>
            {fontExpanded && (
              <div className="submenu-items">
                {[8, 10, 12, 14, 16, 18, 20, 24].map((size) => (
                  <button
                    key={size}
                    className={`menu-item ${fontSize === size ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange(size)}
                  >
                    <span>{size}px</span>
                    {fontSize === size && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="menu-separator" />

          <button
            className={`menu-item ${specialCharsVisible ? 'active' : ''}`}
            onClick={() => {
              toggleSpecialChars();
              closeAllMenus();
            }}
          >
            <span>Show Special Chars Bar</span>
            {specialCharsVisible && <span>✓</span>}
          </button>

          <button
            className={`menu-item ${lineNumbers ? 'active' : ''}`}
            onClick={() => {
              toggleLineNumbers();
              closeAllMenus();
            }}
          >
            <span>Show Line Numbers</span>
            {lineNumbers && <span>✓</span>}
          </button>

          <button
            className={`menu-item ${statusBar ? 'active' : ''}`}
            onClick={() => {
              toggleStatusBar();
              closeAllMenus();
            }}
          >
            <span>Show Status Bar</span>
            {statusBar && <span>✓</span>}
          </button>

          <div className="menu-separator" />

          <button className="menu-item" onClick={() => handleZoom('in')}>
            <span>Zoom In</span>
            <span className="menu-shortcut">Ctrl++</span>
          </button>

          <button className="menu-item" onClick={() => handleZoom('out')}>
            <span>Zoom Out</span>
            <span className="menu-shortcut">Ctrl+-</span>
          </button>

          <button className="menu-item" onClick={() => handleZoom('reset')}>
            <span>Reset Zoom</span>
            <span className="menu-shortcut">Ctrl+0</span>
          </button>
        </div>
      )}
    </div>
  );
};
