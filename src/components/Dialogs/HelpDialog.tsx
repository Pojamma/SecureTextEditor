import React, { useState } from 'react';
import './HelpDialog.css';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'shortcuts' | 'features' | 'about';

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('shortcuts');

  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Document Management', items: [
      { keys: 'Ctrl+N', description: 'Create new document' },
      { keys: 'Ctrl+S', description: 'Save current document' },
      { keys: 'Ctrl+Shift+S', description: 'Share document' },
      { keys: 'Ctrl+Alt+S', description: 'Save all modified documents' },
      { keys: 'Ctrl+W', description: 'Close current tab' },
    ]},
    { category: 'Editing', items: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Y', description: 'Redo' },
      { keys: 'Ctrl+X', description: 'Cut' },
      { keys: 'Ctrl+C', description: 'Copy' },
      { keys: 'Ctrl+V', description: 'Paste' },
      { keys: 'Ctrl+A', description: 'Select all' },
      { keys: 'Ctrl+Shift+C', description: 'Copy all content to clipboard' },
    ]},
    { category: 'Search', items: [
      { keys: 'Ctrl+F', description: 'Find in current document' },
      { keys: 'Ctrl+H', description: 'Find and replace' },
      { keys: 'Ctrl+Shift+F', description: 'Search in all tabs' },
    ]},
    { category: 'View', items: [
      { keys: 'Ctrl+=', description: 'Increase font size' },
      { keys: 'Ctrl+-', description: 'Decrease font size' },
      { keys: 'Ctrl+0', description: 'Reset font size' },
      { keys: 'Ctrl+I', description: 'Show statistics' },
      { keys: 'F3', description: 'Insert special character' },
    ]},
    { category: 'Tab Navigation', items: [
      { keys: 'Ctrl+Tab', description: 'Next tab' },
      { keys: 'Ctrl+Shift+Tab', description: 'Previous tab' },
      { keys: 'Ctrl+1-9', description: 'Go to tab 1-9' },
      { keys: 'Swipe Left', description: 'Next tab (mobile)' },
      { keys: 'Swipe Right', description: 'Previous tab (mobile)' },
    ]},
  ];

  const features = [
    {
      title: 'Multi-Tab Editing',
      description: 'Work with multiple documents simultaneously. Switch between tabs using Ctrl+Tab or swipe gestures on mobile.',
    },
    {
      title: 'Session Persistence',
      description: 'Your open documents and settings are automatically saved. When you reopen the app, everything is restored exactly as you left it.',
    },
    {
      title: 'AES-256 Encryption',
      description: 'Protect sensitive documents with military-grade encryption. Encrypted files require a password to open and are completely secure.',
    },
    {
      title: 'External File Access',
      description: 'Open and edit files from anywhere on your device - Downloads, Documents, SD card, or any accessible location. Changes are saved directly to the original location.',
    },
    {
      title: 'Auto-Save',
      description: 'Documents are automatically saved as you type (for unencrypted local files). Look for the checkmark in the status bar.',
    },
    {
      title: 'Theme Support',
      description: 'Choose from 6 beautiful themes: Light, Dark, Solarized Light, Solarized Dark, Dracula, and Nord. Access via Settings or the theme button.',
    },
    {
      title: 'Customizable Editor',
      description: 'Adjust font size, cursor style (block/line/underline), cursor blink, and word wrap to suit your preferences.',
    },
    {
      title: 'Special Characters',
      description: 'Quick access to commonly used special characters via the special chars bar or F3 dialog.',
    },
    {
      title: 'Statistics',
      description: 'View detailed text statistics including character count, word count, line count, reading time, and more (Ctrl+I).',
    },
    {
      title: 'File Management',
      description: 'Rename, copy, delete, encrypt, and decrypt files directly from the file picker. Right-click (or tap the ⋮ button) on any file.',
    },
  ];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container help-dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Help</h2>
          <button className="dialog-close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="help-dialog">
          <div className="help-tabs">
            <button
              className={`help-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              Keyboard Shortcuts
            </button>
            <button
              className={`help-tab ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button
              className={`help-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
          </div>

          <div className="help-content">
            {activeTab === 'shortcuts' && (
              <div className="shortcuts-tab">
                <p className="help-intro">
                  SecureTextEditor supports many keyboard shortcuts to help you work efficiently.
                  On mobile devices, some shortcuts may not be available.
                </p>

                {shortcuts.map((section) => (
                  <div key={section.category} className="shortcut-section">
                    <h3 className="shortcut-category">{section.category}</h3>
                    <div className="shortcut-list">
                      {section.items.map((shortcut, index) => (
                        <div key={index} className="shortcut-item">
                          <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                          <span className="shortcut-description">{shortcut.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="features-tab">
                <p className="help-intro">
                  SecureTextEditor is packed with features to make your text editing secure,
                  efficient, and enjoyable.
                </p>

                <div className="features-list">
                  {features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-description">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="about-tab">
                <div className="about-header">
                  <h2 className="app-name">SecureTextEditor</h2>
                  <p className="app-version">Version 0.1.0</p>
                </div>

                <div className="about-section">
                  <h3>About This App</h3>
                  <p>
                    SecureTextEditor is a privacy-focused, cross-platform text editor designed
                    for secure note-taking and document editing. Built with modern web technologies,
                    it runs natively on Android and Windows while maintaining the highest security
                    standards.
                  </p>
                </div>

                <div className="about-section">
                  <h3>Security & Privacy</h3>
                  <p>
                    All encryption is performed locally on your device using AES-256-GCM, the same
                    encryption standard used by governments and security professionals. Your passwords
                    are never stored anywhere - they exist only in memory while you're working with
                    encrypted files.
                  </p>
                </div>

                <div className="about-section">
                  <h3>Technology Stack</h3>
                  <ul className="tech-list">
                    <li>React + TypeScript for robust, type-safe code</li>
                    <li>CodeMirror 6 for advanced text editing</li>
                    <li>Capacitor for native mobile capabilities</li>
                    <li>Zustand for efficient state management</li>
                    <li>Web Crypto API for secure encryption</li>
                  </ul>
                </div>

                <div className="about-section">
                  <h3>Tips for Best Experience</h3>
                  <ul className="tips-list">
                    <li>Use Settings (⚙️) to customize the editor to your preferences</li>
                    <li>Enable Auto-Save in Settings for automatic document saving</li>
                    <li>Try different themes to find the one that's most comfortable for your eyes</li>
                    <li>Use Ctrl+Shift+F to search across all open documents</li>
                    <li>For encrypted files, choose strong, memorable passwords</li>
                    <li>Take advantage of keyboard shortcuts to work more efficiently</li>
                  </ul>
                </div>

                <div className="about-footer">
                  <p>
                    SecureTextEditor is built with privacy and security as top priorities.
                    Your data stays on your device, under your control.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
