import React, { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { themeNames } from '@/utils/themes';
import './SettingsDialog.css';

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    lineNumbers,
    toggleLineNumbers,
    statusBar,
    toggleStatusBar,
    wordWrap,
    toggleWordWrap,
    cursorStyle,
    setCursorStyle,
    cursorBlink,
    toggleCursorBlink,
    confirmOnExit,
    setConfirmOnExit,
    autoLoadLastFile,
    setAutoLoadLastFile,
    autoSave,
    setAutoSave,
    autoSaveInterval,
    setAutoSaveInterval,
    maxRecentFiles,
    setMaxRecentFiles,
    specialCharsVisible,
    toggleSpecialChars,
    backButtonExitConfirmation,
    setBackButtonExitConfirmation,
    backButtonClosesTab,
    setBackButtonClosesTab,
    resetSettings,
  } = useSettingsStore();

  const { showNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'editor' | 'appearance' | 'behavior'>('appearance');

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      showNotification('Settings reset to defaults', 'success');
    }
  };

  const themeDisplayNames: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    solarizedLight: 'Solarized Light',
    solarizedDark: 'Solarized Dark',
    dracula: 'Dracula',
    nord: 'Nord',
    monokai: 'Monokai',
    oneDark: 'One Dark',
    tokyoNight: 'Tokyo Night',
    gruvboxDark: 'Gruvbox Dark',
    gruvboxLight: 'Gruvbox Light',
    cobalt: 'Cobalt',
    materialOcean: 'Material Ocean',
    palenight: 'Palenight',
    ayuDark: 'Ayu Dark',
    ayuLight: 'Ayu Light',
    githubLight: 'GitHub Light',
    githubDark: 'GitHub Dark',
    tomorrow: 'Tomorrow',
    tomorrowNight: 'Tomorrow Night',
    highContrastDark: 'High Contrast Dark ♿',
    highContrastLight: 'High Contrast Light ♿',
    increasedContrast: 'Increased Contrast ♿',
    protanopia: 'Protanopia Friendly ♿',
    deuteranopia: 'Deuteranopia Friendly ♿',
    largeText: 'Large Text ♿',
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Settings</h2>
          <button className="dialog-close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`settings-tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button
            className={`settings-tab ${activeTab === 'behavior' ? 'active' : ''}`}
            onClick={() => setActiveTab('behavior')}
          >
            Behavior
          </button>
        </div>

        <div className="dialog-content settings-content">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              {/* Theme Selection */}
              <div className="setting-group">
                <label className="setting-label">Theme</label>
                <select
                  className="setting-select"
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    showNotification(`Theme changed to ${themeDisplayNames[e.target.value]}`, 'success');
                  }}
                >
                  {themeNames.map((themeName) => (
                    <option key={themeName} value={themeName}>
                      {themeDisplayNames[themeName] || themeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="setting-group">
                <label className="setting-label">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="setting-range"
                />
                <div className="setting-range-labels">
                  <span>8px</span>
                  <span>24px</span>
                </div>
              </div>

              {/* View Options */}
              <div className="setting-group">
                <label className="setting-label">View Options</label>
                <div className="setting-checkboxes">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={toggleLineNumbers}
                    />
                    <span>Show Line Numbers</span>
                  </label>
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={statusBar}
                      onChange={toggleStatusBar}
                    />
                    <span>Show Status Bar</span>
                  </label>
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={specialCharsVisible}
                      onChange={toggleSpecialChars}
                    />
                    <span>Show Special Characters Bar</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="settings-section">
              {/* Cursor Style */}
              <div className="setting-group">
                <label className="setting-label">Cursor Style</label>
                <select
                  className="setting-select"
                  value={cursorStyle}
                  onChange={(e) => setCursorStyle(e.target.value as 'block' | 'line' | 'underline')}
                >
                  <option value="line">Line (|)</option>
                  <option value="block">Block (█)</option>
                  <option value="underline">Underline (_)</option>
                </select>
              </div>

              {/* Cursor Blink */}
              <div className="setting-group">
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={cursorBlink}
                    onChange={toggleCursorBlink}
                  />
                  <span>Cursor Blink</span>
                </label>
              </div>

              {/* Word Wrap */}
              <div className="setting-group">
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={toggleWordWrap}
                  />
                  <span>Line Wrap</span>
                </label>
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === 'behavior' && (
            <div className="settings-section">
              {/* Auto-Save */}
              <div className="setting-group">
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => {
                      setAutoSave(e.target.checked);
                      showNotification(
                        e.target.checked ? 'Auto-save enabled' : 'Auto-save disabled',
                        'info'
                      );
                    }}
                  />
                  <span>Auto-Save</span>
                </label>
              </div>

              {/* Auto-Save Interval */}
              {autoSave && (
                <div className="setting-group setting-indent">
                  <label className="setting-label">Auto-Save Interval</label>
                  <select
                    className="setting-select"
                    value={autoSaveInterval}
                    onChange={(e) => {
                      const interval = Number(e.target.value) as 1 | 2 | 5 | 10;
                      setAutoSaveInterval(interval);
                      showNotification(
                        `Auto-save interval set to ${interval} minute${interval > 1 ? 's' : ''}`,
                        'success'
                      );
                    }}
                  >
                    <option value="1">1 minute</option>
                    <option value="2">2 minutes</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                  </select>
                </div>
              )}

              {/* Confirm on Exit */}
              <div className="setting-group">
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmOnExit}
                    onChange={(e) => setConfirmOnExit(e.target.checked)}
                  />
                  <span>Confirm on Exit</span>
                </label>
                <p className="setting-description">
                  Ask for confirmation before closing the app with unsaved changes
                </p>
              </div>

              {/* Auto-Load Last File */}
              <div className="setting-group">
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={autoLoadLastFile}
                    onChange={(e) => setAutoLoadLastFile(e.target.checked)}
                  />
                  <span>Auto-Load Last Session</span>
                </label>
                <p className="setting-description">
                  Automatically restore documents from your last session on startup
                </p>
              </div>

              {/* Max Recent Files */}
              <div className="setting-group">
                <label className="setting-label">Maximum Recent Files</label>
                <select
                  className="setting-select"
                  value={maxRecentFiles}
                  onChange={(e) => {
                    const max = Number(e.target.value);
                    setMaxRecentFiles(max);
                    showNotification(
                      `Recent files limit set to ${max}`,
                      'success'
                    );
                  }}
                >
                  <option value="5">5 files</option>
                  <option value="10">10 files</option>
                  <option value="15">15 files</option>
                  <option value="20">20 files</option>
                  <option value="25">25 files</option>
                  <option value="50">50 files</option>
                </select>
                <p className="setting-description">
                  Number of recent files to keep in the sidebar menu
                </p>
              </div>

              {/* Back Button Settings */}
              <div className="setting-group">
                <label className="setting-label">Back Button (Android)</label>
                <div className="setting-checkboxes">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={backButtonExitConfirmation}
                      onChange={(e) => setBackButtonExitConfirmation(e.target.checked)}
                    />
                    <span>Confirm Before Exit</span>
                  </label>
                  <p className="setting-description">
                    Show confirmation dialog when pressing back button to exit the app
                  </p>

                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={backButtonClosesTab}
                      onChange={(e) => setBackButtonClosesTab(e.target.checked)}
                    />
                    <span>Close Tab Instead of Exit</span>
                  </label>
                  <p className="setting-description">
                    Back button closes the current tab and returns to home screen. At home screen, back button exits the app.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-button secondary-button" onClick={handleReset} type="button">
            Reset to Defaults
          </button>
          <button className="dialog-button primary-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
