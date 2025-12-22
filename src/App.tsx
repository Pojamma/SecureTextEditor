import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useDocumentStore } from './stores/documentStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { generateId, formatDate, countCharacters } from './utils/helpers';
import { OpenDocument } from './types/document.types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { HamburgerMenu } from './components/Menus/HamburgerMenu';
import { Notification } from './components/Notification';
import { EditorTabs } from './components/EditorTabs';
import { CodeMirrorEditor, CodeMirrorEditorHandle } from './components/CodeMirrorEditor';
import { SessionService } from './services/session.service';
import { readFile, decryptFile } from './services/filesystem.service';
import { calculateStatistics } from './utils/textUtils';
import { shareDocument, copyToClipboard } from './utils/exportUtils';
import './App.css';

// Lazy load components that aren't immediately needed
const PasswordDialog = lazy(() => import('./components/Dialogs/PasswordDialog').then(m => ({ default: m.PasswordDialog })));
const StatisticsDialog = lazy(() => import('./components/StatisticsDialog').then(m => ({ default: m.StatisticsDialog })));
const SpecialCharDialog = lazy(() => import('./components/SpecialCharDialog').then(m => ({ default: m.SpecialCharDialog })));
const SpecialCharsBar = lazy(() => import('./components/SpecialCharsBar').then(m => ({ default: m.SpecialCharsBar })));
const SearchAllTabsPanel = lazy(() => import('./components/SearchAllTabsPanel').then(m => ({ default: m.SearchAllTabsPanel })));

const App: React.FC = () => {
  const editorRef = useRef<CodeMirrorEditorHandle>(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1 });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [encryptedDataForDecrypt, setEncryptedDataForDecrypt] = useState<{
    docId: string;
    path: string;
  } | null>(null);

  // Store hooks
  const { documents, activeDocumentId, addDocument, updateContent, updateDocument, getActiveDocument, closeDocument, setActiveDocument, restoreSession } =
    useDocumentStore();
  const { theme, setTheme, fontSize, setFontSize, statusBar, specialCharsVisible } = useSettingsStore();
  const { toggleMenu, showNotification, dialogs, openDialog, closeDialog, showSearchAllTabs, searchAllTabsVisible, hideSearchAllTabs, menus } = useUIStore();

  // Swipe gesture handler for tab navigation
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      // Swipe left = next tab
      if (documents.length <= 1) return;
      const currentIndex = documents.findIndex(doc => doc.id === activeDocumentId);
      const nextIndex = (currentIndex + 1) % documents.length;
      setActiveDocument(documents[nextIndex].id);
      showNotification('Next tab', 'info');
    },
    onSwipeRight: () => {
      // Swipe right = previous tab
      if (documents.length <= 1) return;
      const currentIndex = documents.findIndex(doc => doc.id === activeDocumentId);
      const prevIndex = currentIndex - 1 < 0 ? documents.length - 1 : currentIndex - 1;
      setActiveDocument(documents[prevIndex].id);
      showNotification('Previous tab', 'info');
    },
    minSwipeDistance: 100, // Require 100px swipe to trigger
    maxSwipeTime: 500, // Allow up to 500ms for the swipe
  });

  const activeDoc = getActiveDocument();

  // Android back button handler
  useAndroidBackButton({
    onBackPress: () => {
      // Priority 1: Close any open dialogs
      if (dialogs.statisticsDialog) {
        closeDialog('statisticsDialog');
        return true;
      }
      if (dialogs.specialCharDialog) {
        closeDialog('specialCharDialog');
        return true;
      }
      if (showPasswordDialog) {
        handlePasswordCancel();
        return true;
      }

      // Priority 2: Close search all tabs panel
      if (searchAllTabsVisible) {
        hideSearchAllTabs();
        return true;
      }

      // Priority 3: Close hamburger menu
      if (menus.hamburgerMenu) {
        toggleMenu('hamburgerMenu');
        return true;
      }

      // If nothing to close, allow default behavior (exit app)
      return false;
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      action: () => {
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
      },
      description: 'New Document',
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        showNotification('Save functionality coming soon!', 'info');
      },
      description: 'Save',
    },
    {
      key: 'w',
      ctrl: true,
      action: () => {
        if (activeDocumentId) {
          closeDocument(activeDocumentId);
          showNotification('Tab closed', 'info');
        }
      },
      description: 'Close Tab',
    },
    // Note: Ctrl+F is handled natively by CodeMirror's built-in search
    {
      key: '=',
      ctrl: true,
      action: () => {
        setFontSize(Math.min(fontSize + 2, 24));
      },
      description: 'Zoom In',
    },
    {
      key: '-',
      ctrl: true,
      action: () => {
        setFontSize(Math.max(fontSize - 2, 8));
      },
      description: 'Zoom Out',
    },
    {
      key: '0',
      ctrl: true,
      action: () => {
        setFontSize(14);
      },
      description: 'Reset Zoom',
    },
    {
      key: 'i',
      ctrl: true,
      action: () => {
        openDialog('statisticsDialog');
      },
      description: 'Show Statistics',
    },
    {
      key: 'F3',
      action: () => {
        openDialog('specialCharDialog');
      },
      description: 'Insert Special Character',
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      action: async () => {
        if (activeDoc) {
          try {
            await shareDocument(activeDoc.metadata.filename, activeDoc.content);
            showNotification('Document shared', 'success');
          } catch (error) {
            showNotification('Failed to share document', 'error');
          }
        }
      },
      description: 'Share Document',
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      action: async () => {
        if (activeDoc) {
          try {
            await copyToClipboard(activeDoc.content);
            showNotification('Content copied to clipboard', 'success');
          } catch (error) {
            showNotification('Failed to copy to clipboard', 'error');
          }
        }
      },
      description: 'Copy to Clipboard',
    },
    // Tab navigation
    {
      key: 'Tab',
      ctrl: true,
      action: () => {
        if (documents.length <= 1) return;
        const currentIndex = documents.findIndex(doc => doc.id === activeDocumentId);
        const nextIndex = (currentIndex + 1) % documents.length;
        setActiveDocument(documents[nextIndex].id);
      },
      description: 'Next Tab',
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      action: () => {
        if (documents.length <= 1) return;
        const currentIndex = documents.findIndex(doc => doc.id === activeDocumentId);
        const prevIndex = currentIndex - 1 < 0 ? documents.length - 1 : currentIndex - 1;
        setActiveDocument(documents[prevIndex].id);
      },
      description: 'Previous Tab',
    },
    // Ctrl+1 through Ctrl+9 to go to specific tab
    {
      key: '1',
      ctrl: true,
      action: () => {
        if (documents.length >= 1) setActiveDocument(documents[0].id);
      },
      description: 'Go to Tab 1',
    },
    {
      key: '2',
      ctrl: true,
      action: () => {
        if (documents.length >= 2) setActiveDocument(documents[1].id);
      },
      description: 'Go to Tab 2',
    },
    {
      key: '3',
      ctrl: true,
      action: () => {
        if (documents.length >= 3) setActiveDocument(documents[2].id);
      },
      description: 'Go to Tab 3',
    },
    {
      key: '4',
      ctrl: true,
      action: () => {
        if (documents.length >= 4) setActiveDocument(documents[3].id);
      },
      description: 'Go to Tab 4',
    },
    {
      key: '5',
      ctrl: true,
      action: () => {
        if (documents.length >= 5) setActiveDocument(documents[4].id);
      },
      description: 'Go to Tab 5',
    },
    {
      key: '6',
      ctrl: true,
      action: () => {
        if (documents.length >= 6) setActiveDocument(documents[5].id);
      },
      description: 'Go to Tab 6',
    },
    {
      key: '7',
      ctrl: true,
      action: () => {
        if (documents.length >= 7) setActiveDocument(documents[6].id);
      },
      description: 'Go to Tab 7',
    },
    {
      key: '8',
      ctrl: true,
      action: () => {
        if (documents.length >= 8) setActiveDocument(documents[7].id);
      },
      description: 'Go to Tab 8',
    },
    {
      key: '9',
      ctrl: true,
      action: () => {
        if (documents.length >= 9) setActiveDocument(documents[8].id);
      },
      description: 'Go to Tab 9',
    },
    {
      key: 'f',
      ctrl: true,
      shift: true,
      action: () => {
        showSearchAllTabs();
      },
      description: 'Search All Tabs',
    },
  ]);

  // Restore session on app launch
  useEffect(() => {
    // Only run once on mount
    const session = SessionService.loadSession();

    if (session && session.documents.length > 0 && !SessionService.isSessionExpired()) {
      // Restore documents and active document
      restoreSession(session.documents, session.activeDocumentId);

      // Restore UI settings
      if (session.uiState) {
        setTheme(session.uiState.theme);
        setFontSize(session.uiState.fontSize);
      }

      showNotification('Session restored', 'success');
    } else {
      // No valid session, create welcome document
      const welcomeDoc: OpenDocument = {
        id: generateId(),
        path: '',
        source: 'temp',
        encrypted: false,
        content: `Welcome to SecureTextEditor! 🔐

This is a secure, encrypted text editor for Android and Windows.

Features Available:
• Multi-tab document editing with keyboard shortcuts
• Tab navigation (Ctrl+Tab, Ctrl+1-9)
• Session persistence (auto-restore on launch)
• 6 beautiful themes (Light, Dark, Solarized, Dracula, Nord)
• Persistent settings
• Real-time character and line counting

Coming Soon:
• AES-256-GCM encryption
• Google Drive integration
• Local file operations
• Auto-save functionality
• Cross-platform deployment

Start typing to edit this document...`,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          created: formatDate(),
          modified: formatDate(),
          filename: 'Welcome.txt',
        },
      };
      addDocument(welcomeDoc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Save session whenever state changes
  useEffect(() => {
    // Don't save if there are no documents (initial state)
    if (documents.length === 0) return;

    const saveSession = () => {
      SessionService.saveSession({
        documents,
        activeDocumentId,
        uiState: {
          theme,
          fontSize,
          statusBar,
        },
      });
    };

    // Debounce session saves to avoid excessive writes
    const timeoutId = setTimeout(saveSession, 500);
    return () => clearTimeout(timeoutId);
  }, [documents, activeDocumentId, theme, fontSize, statusBar]);

  // Save session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (documents.length > 0) {
        SessionService.saveSession({
          documents,
          activeDocumentId,
          uiState: {
            theme,
            fontSize,
            statusBar,
          },
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [documents, activeDocumentId, theme, fontSize, statusBar]);

  // Check if active document is encrypted and needs decryption
  useEffect(() => {
    if (activeDoc && activeDoc.encrypted && activeDoc.content === '' && activeDoc.path) {
      // This is an encrypted document that was restored from session with cleared content
      // Prompt for password
      setEncryptedDataForDecrypt({
        docId: activeDoc.id,
        path: activeDoc.path,
      });
      setShowPasswordDialog(true);
    }
  }, [activeDocumentId, activeDoc]);

  // Handle password confirmation for decryption
  const handlePasswordConfirm = async (password: string) => {
    if (!encryptedDataForDecrypt) return;

    try {
      // Read the encrypted file from disk
      const result = await readFile(encryptedDataForDecrypt.path);

      if (!result.requiresPassword || !result.encryptedData) {
        throw new Error('File is not encrypted or could not be read');
      }

      // Decrypt the file
      const decryptedDoc = await decryptFile(
        result.encryptedData,
        password,
        encryptedDataForDecrypt.path
      );

      // Update the document with decrypted content
      updateDocument(encryptedDataForDecrypt.docId, {
        content: decryptedDoc.content,
        modified: false,
      });

      showNotification('File decrypted successfully', 'success');
      setShowPasswordDialog(false);
      setEncryptedDataForDecrypt(null);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to decrypt file',
        'error'
      );
    }
  };

  // Handle password dialog cancel
  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    setEncryptedDataForDecrypt(null);
    showNotification('Decryption cancelled', 'info');
  };

  // Search is now handled natively by CodeMirror (Ctrl+F)
  // Note: CodeMirror manages cursor and scroll position internally through its state

  // Handle special character insertion
  const handleSpecialCharClick = (char: string) => {
    editorRef.current?.insertText(char);
  };

  // Handle content changes (CodeMirror passes string directly)
  const handleContentChange = (value: string) => {
    if (activeDocumentId) {
      updateContent(activeDocumentId, value);
    }
  };

  // Handle cursor position changes (CodeMirror passes position number)
  const handleCursorChange = (position: number) => {
    if (activeDocumentId && activeDoc) {
      // Calculate line and column from position
      const textBeforeCursor = activeDoc.content.substring(0, position);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      setCursorInfo({ line, column });

      // Save cursor position to document
      updateDocument(activeDocumentId, { cursorPosition: position });
    }
  };

  // Cycle through themes (for demo)
  const cycleTheme = () => {
    const themes = ['light', 'dark', 'solarizedLight', 'solarizedDark', 'dracula', 'nord'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const charCount = activeDoc ? countCharacters(activeDoc.content) : 0;
  const lineCount = activeDoc ? activeDoc.content.split('\n').length : 0;

  return (
    <div className="app">
      <HamburgerMenu />
      <Notification />

      {/* Password dialog for decrypting encrypted files from session */}
      {showPasswordDialog && (
        <Suspense fallback={<div />}>
          <PasswordDialog
            mode="decrypt"
            onConfirm={handlePasswordConfirm}
            onCancel={handlePasswordCancel}
            filename={activeDoc?.metadata.filename}
          />
        </Suspense>
      )}

      {/* Statistics Dialog */}
      {dialogs.statisticsDialog && (
        <Suspense fallback={<div />}>
          <StatisticsDialog
            isOpen={dialogs.statisticsDialog}
            onClose={() => closeDialog('statisticsDialog')}
            statistics={calculateStatistics(activeDoc?.content || '')}
          />
        </Suspense>
      )}

      {/* Special Character Dialog */}
      {dialogs.specialCharDialog && (
        <Suspense fallback={<div />}>
          <SpecialCharDialog
            isOpen={dialogs.specialCharDialog}
            onClose={() => closeDialog('specialCharDialog')}
            onCharacterSelect={handleSpecialCharClick}
          />
        </Suspense>
      )}

      {/* Search is now handled natively by CodeMirror (Ctrl+F) */}

      <header className="header">
        <div className="toolbar">
          <button
            className="menu-button"
            onClick={() => toggleMenu('hamburgerMenu')}
            title="Menu (or try Ctrl+N for new doc)"
          >
            ☰
          </button>
          <h1 className="app-title">SecureTextEditor</h1>
          <div className="toolbar-actions">
            <button
              className="icon-button"
              title="Search"
              onClick={() => editorRef.current?.openSearch()}
            >
              🔍
            </button>
            <button
              className="icon-button"
              onClick={cycleTheme}
              title={`Current: ${theme} (Click to change or use View menu)`}
            >
              🎨
            </button>
            <button
              className="icon-button"
              title="Settings"
              onClick={() => showNotification('Settings dialog coming soon!', 'info')}
            >
              ⚙️
            </button>
            <button
              className="icon-button"
              title="Help"
              onClick={() => showNotification('Help system coming soon!', 'info')}
            >
              ❓
            </button>
          </div>
        </div>
      </header>

      <EditorTabs />

      <main className="main-content" ref={swipeRef}>
        <div className="editor-container">
          <CodeMirrorEditor
            ref={editorRef}
            value={activeDoc?.content || ''}
            onChange={handleContentChange}
            onCursorChange={handleCursorChange}
            fontSize={fontSize}
            theme={theme as 'light' | 'dark' | 'solarizedLight' | 'solarizedDark' | 'dracula' | 'nord'}
            placeholder="Start typing... (Try Ctrl+N for new document, or click the ☰ menu)"
          />
        </div>
      </main>

      {specialCharsVisible && (
        <Suspense fallback={<div />}>
          <SpecialCharsBar onCharacterClick={handleSpecialCharClick} />
        </Suspense>
      )}

      {/* Search All Tabs Panel */}
      {searchAllTabsVisible && (
        <Suspense fallback={<div />}>
          <SearchAllTabsPanel />
        </Suspense>
      )}

      {statusBar && (
        <footer className="status-bar">
          <span>
            Line: {cursorInfo.line} | Col: {cursorInfo.column} | {charCount} chars |{' '}
            {lineCount} lines | {activeDoc?.metadata.filename || 'Untitled'}{' '}
            {activeDoc?.modified ? '●' : ''}
          </span>
        </footer>
      )}
    </div>
  );
};

export default App;
