import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { generateId, formatDate } from '@/utils/helpers';
import { OpenDocument, EncryptedDocument } from '@/types/document.types';
import { FilePickerDialog } from '@/components/Dialogs/FilePickerDialog';
import { PasswordDialog } from '@/components/Dialogs/PasswordDialog';
import { readFile, decryptFile, saveFile, saveFileAs } from '@/services/filesystem.service';

export const FileMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingEncryptedData, setPendingEncryptedData] = useState<{
    data: EncryptedDocument;
    path: string;
  } | null>(null);
  const [saveAsMode, setSaveAsMode] = useState(false);

  const { addDocument, closeDocument, closeAllDocuments, documents, hasUnsavedChanges, getActiveDocument, updateDocument, activeDocumentId } =
    useDocumentStore();
  const { closeAllMenus, showNotification } = useUIStore();

  const activeDoc = getActiveDocument();

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
    closeAllMenus();
    showNotification('New document created', 'success');
  };

  const handleOpenLocal = () => {
    setShowFilePicker(true);
  };

  const handleFileSelect = async (filename: string) => {
    setShowFilePicker(false);
    try {
      const result = await readFile(filename);

      if (result.requiresPassword && result.encryptedData) {
        // Show password dialog for encrypted file
        setPendingEncryptedData({
          data: result.encryptedData,
          path: filename,
        });
        setShowPasswordDialog(true);
      } else {
        // Open plain file
        addDocument(result.document);
        showNotification(`Opened "${filename}"`, 'success');
      }
      closeAllMenus();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to open file',
        'error'
      );
    }
  };

  const handleDecryptPassword = async (password: string) => {
    if (!pendingEncryptedData) return;

    try {
      const document = await decryptFile(
        pendingEncryptedData.data,
        password,
        pendingEncryptedData.path
      );
      addDocument(document);
      showNotification(`Opened and decrypted "${document.metadata.filename}"`, 'success');
      closeAllMenus();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Decryption failed',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setPendingEncryptedData(null);
    }
  };

  const handleOpenDrive = () => {
    showNotification('Google Drive integration coming soon!', 'info');
    closeAllMenus();
  };

  const handleSave = async () => {
    if (!activeDoc) {
      showNotification('No active document to save', 'error');
      return;
    }

    // If document has no path, treat as Save As
    if (!activeDoc.path) {
      handleSaveAs();
      return;
    }

    try {
      // If encrypted, prompt for password
      if (activeDoc.encrypted) {
        setSaveAsMode(false);
        setShowPasswordDialog(true);
      } else {
        await saveFile(activeDoc);
        if (activeDocumentId) {
          updateDocument(activeDocumentId, { modified: false });
        }
        showNotification(`Saved "${activeDoc.metadata.filename}"`, 'success');
        closeAllMenus();
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    }
  };

  const handleSaveAs = () => {
    if (!activeDoc) {
      showNotification('No active document to save', 'error');
      return;
    }

    const newFilename = prompt('Enter filename:', activeDoc.metadata.filename);
    if (!newFilename) return;

    if (activeDoc.encrypted) {
      setSaveAsMode(true);
      setShowPasswordDialog(true);
    } else {
      performSaveAs(newFilename);
    }
  };

  const performSaveAs = async (newFilename: string, password?: string) => {
    if (!activeDoc || !activeDocumentId) return;

    try {
      const newPath = await saveFileAs(activeDoc, newFilename, password);
      updateDocument(activeDocumentId, {
        path: newPath,
        modified: false,
        metadata: {
          ...activeDoc.metadata,
          filename: newFilename,
        },
      });
      showNotification(`Saved as "${newFilename}"`, 'success');
      closeAllMenus();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    }
  };

  const handleSavePassword = async (password: string) => {
    if (!activeDoc) return;

    try {
      if (saveAsMode) {
        const newFilename = prompt('Enter filename:', activeDoc.metadata.filename);
        if (newFilename) {
          await performSaveAs(newFilename, password);
        }
      } else {
        await saveFile(activeDoc, password);
        if (activeDocumentId) {
          updateDocument(activeDocumentId, { modified: false });
        }
        showNotification(`Saved "${activeDoc.metadata.filename}"`, 'success');
        closeAllMenus();
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setSaveAsMode(false);
    }
  };

  const handleSaveAll = () => {
    showNotification('Save All functionality coming soon!', 'info');
    closeAllMenus();
  };

  const handleCloseTab = () => {
    if (documents.length > 0 && documents[0]) {
      closeDocument(documents[0].id);
      showNotification('Tab closed', 'info');
    }
    closeAllMenus();
  };

  const handleCloseAll = () => {
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Close all tabs anyway?')) {
        closeAllDocuments();
        showNotification('All tabs closed', 'info');
      }
    } else {
      closeAllDocuments();
      showNotification('All tabs closed', 'info');
    }
    closeAllMenus();
  };

  return (
    <>
      <div className="menu-section">
        <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
          <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
          <span className="menu-section-title">File</span>
        </div>

        {expanded && (
          <div className="menu-items">
            <button className="menu-item" onClick={handleNewDocument}>
              <span>New Document</span>
              <span className="menu-shortcut">Ctrl+N</span>
            </button>

            <button className="menu-item" onClick={handleOpenLocal}>
              <span>Open Local File</span>
              <span className="menu-shortcut">Ctrl+O</span>
            </button>

            <button className="menu-item" onClick={handleOpenDrive}>
              <span>Open from Google Drive</span>
              <span className="menu-shortcut">Ctrl+Shift+O</span>
            </button>

            <div className="menu-separator" />

            <button className="menu-item" onClick={handleSave}>
              <span>Save</span>
              <span className="menu-shortcut">Ctrl+S</span>
            </button>

            <button className="menu-item" onClick={handleSaveAs}>
              <span>Save As</span>
              <span className="menu-shortcut">Ctrl+Shift+S</span>
            </button>

            <button className="menu-item" onClick={handleSaveAll}>
              <span>Save All</span>
              <span className="menu-shortcut">Ctrl+Alt+S</span>
            </button>

            <div className="menu-separator" />

            <button className="menu-item" onClick={handleCloseTab}>
              <span>Close Tab</span>
              <span className="menu-shortcut">Ctrl+W</span>
            </button>

            <button className="menu-item" onClick={handleCloseAll}>
              <span>Close All Tabs</span>
            </button>
          </div>
        )}
      </div>

      {/* File Picker Dialog */}
      {showFilePicker && (
        <FilePickerDialog
          onSelect={handleFileSelect}
          onCancel={() => setShowFilePicker(false)}
        />
      )}

      {/* Password Dialog for decryption or save */}
      {showPasswordDialog && (
        <PasswordDialog
          mode={pendingEncryptedData ? 'decrypt' : 'encrypt'}
          onConfirm={pendingEncryptedData ? handleDecryptPassword : handleSavePassword}
          onCancel={() => {
            setShowPasswordDialog(false);
            setPendingEncryptedData(null);
            setSaveAsMode(false);
          }}
          filename={pendingEncryptedData?.data.metadata.filename || activeDoc?.metadata.filename}
        />
      )}
    </>
  );
};
