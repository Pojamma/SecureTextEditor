import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { generateId, formatDate } from '@/utils/helpers';
import { OpenDocument, EncryptedDocument, PlainDocument } from '@/types/document.types';
import { FilePickerDialog } from '@/components/Dialogs/FilePickerDialog';
import { DriveFilePickerDialog } from '@/components/Dialogs/DriveFilePickerDialog';
import { PasswordDialog } from '@/components/Dialogs/PasswordDialog';
import { readFile, decryptFile, saveFile, saveFileAs } from '@/services/filesystem.service';
import {
  isAuthenticated,
  signIn,
  signOut,
  downloadFile
} from '@/services/googleDrive.service';
import { isEncrypted, decryptDocument } from '@/services/encryption.service';

export const FileMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingEncryptedData, setPendingEncryptedData] = useState<{
    data: EncryptedDocument;
    path: string;
  } | null>(null);
  const [saveAsMode, setSaveAsMode] = useState(false);
  const [driveAuthenticated, setDriveAuthenticated] = useState(false);
  const [pendingDriveFile, setPendingDriveFile] = useState<{
    fileId: string;
    filename: string;
  } | null>(null);

  const { addDocument, closeDocument, closeAllDocuments, documents, hasUnsavedChanges, getActiveDocument, updateDocument, setActiveDocument, activeDocumentId } =
    useDocumentStore();
  const { closeAllMenus, showNotification, showConfirmDialog } = useUIStore();

  const activeDoc = getActiveDocument();

  // Check Drive authentication status
  useEffect(() => {
    isAuthenticated().then(setDriveAuthenticated);
  }, []);

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
      // Check if file is already open
      const existingDoc = documents.find(doc => doc.path === filename);
      if (existingDoc) {
        // Switch to existing tab instead of creating duplicate
        setActiveDocument(existingDoc.id);
        showNotification(`Switched to "${filename}"`, 'info');
        closeAllMenus();
        return;
      }

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

  const handleConnectDrive = async () => {
    try {
      const success = await signIn();
      if (success) {
        setDriveAuthenticated(true);
        showNotification('Connected to Google Drive!', 'success');
      } else {
        showNotification('Failed to connect to Google Drive', 'error');
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to connect to Google Drive',
        'error'
      );
    }
    closeAllMenus();
  };

  const handleDisconnectDrive = async () => {
    try {
      await signOut();
      setDriveAuthenticated(false);
      showNotification('Disconnected from Google Drive', 'info');
    } catch (error) {
      showNotification('Failed to disconnect from Google Drive', 'error');
    }
    closeAllMenus();
  };

  const handleOpenDrive = async () => {
    if (!driveAuthenticated) {
      showNotification('Please connect to Google Drive first', 'warning');
      handleConnectDrive();
      return;
    }
    setShowDrivePicker(true);
  };

  const handleDriveFileSelect = async (fileId: string, filename: string) => {
    setShowDrivePicker(false);
    try {
      // Check if file is already open (Drive files use fileId as path)
      const existingDoc = documents.find(doc => doc.path === fileId);
      if (existingDoc) {
        // Switch to existing tab instead of creating duplicate
        setActiveDocument(existingDoc.id);
        showNotification(`Switched to "${filename}"`, 'info');
        closeAllMenus();
        return;
      }

      const content = await downloadFile(fileId);

      // Try to parse as JSON (could be encrypted or plain)
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch {
        parsedData = null;
      }

      // Check if file is encrypted
      if (parsedData && isEncrypted(parsedData)) {
        // Show password dialog for encrypted file
        setPendingDriveFile({ fileId, filename });
        setPendingEncryptedData({
          data: parsedData,
          path: fileId, // Use fileId as path for Drive files
        });
        setShowPasswordDialog(true);
      } else if (parsedData && 'content' in parsedData && 'metadata' in parsedData) {
        // Plain document saved as JSON
        const plainDoc = parsedData as PlainDocument;
        const document: OpenDocument = {
          id: generateId(),
          path: fileId,
          source: 'drive',
          encrypted: false,
          content: plainDoc.content,
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: plainDoc.metadata,
        };
        addDocument(document);
        showNotification(`Opened "${filename}" from Google Drive`, 'success');
      } else {
        // Plain text file
        const document: OpenDocument = {
          id: generateId(),
          path: fileId,
          source: 'drive',
          encrypted: false,
          content: content,
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: {
            filename: filename,
            created: formatDate(),
            modified: formatDate(),
          },
        };
        addDocument(document);
        showNotification(`Opened "${filename}" from Google Drive`, 'success');
      }
      closeAllMenus();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to open file from Google Drive',
        'error'
      );
    }
  };

  const handleDriveDecryptPassword = async (password: string) => {
    if (!pendingEncryptedData || !pendingDriveFile) return;

    try {
      const plainDoc = await decryptDocument(pendingEncryptedData.data, password);
      const document: OpenDocument = {
        id: generateId(),
        path: pendingDriveFile.fileId,
        source: 'drive',
        encrypted: true,
        content: plainDoc.content,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: plainDoc.metadata,
      };
      addDocument(document);
      showNotification(
        `Opened and decrypted "${pendingDriveFile.filename}" from Google Drive`,
        'success'
      );
      closeAllMenus();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Decryption failed',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setPendingEncryptedData(null);
      setPendingDriveFile(null);
    }
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

  const handleSaveAll = async () => {
    const modifiedDocs = documents.filter(doc => doc.modified);

    if (modifiedDocs.length === 0) {
      showNotification('No modified documents to save', 'info');
      closeAllMenus();
      return;
    }

    try {
      let savedCount = 0;
      let failedCount = 0;

      for (const doc of modifiedDocs) {
        try {
          // Skip documents without a path or encrypted documents (require manual save)
          if (!doc.path || doc.encrypted) {
            continue;
          }

          await saveFile(doc);
          updateDocument(doc.id, { modified: false });
          savedCount++;
        } catch (error) {
          console.error(`Failed to save ${doc.metadata.filename}:`, error);
          failedCount++;
        }
      }

      if (savedCount > 0) {
        showNotification(`Saved ${savedCount} document(s)`, 'success');
      }
      if (failedCount > 0) {
        showNotification(`Failed to save ${failedCount} document(s)`, 'warning');
      }
      closeAllMenus();
    } catch (error) {
      showNotification('Failed to save all documents', 'error');
    }
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
      const modifiedDocs = documents.filter(doc => doc.modified);
      showConfirmDialog({
        title: 'Close All Tabs?',
        message: `You have ${modifiedDocs.length} unsaved document(s). Do you want to save before closing all?`,
        confirmText: 'Save All',
        cancelText: 'Cancel',
        showThirdOption: true,
        thirdOptionText: "Close Without Saving",
        onConfirm: async () => {
          // Save all then close
          await handleSaveAll();
          closeAllDocuments();
          showNotification('All tabs closed', 'info');
          closeAllMenus();
        },
        onCancel: () => {
          // Do nothing
        },
        onThirdOption: () => {
          // Close without saving
          closeAllDocuments();
          showNotification('All tabs closed without saving', 'info');
          closeAllMenus();
        },
      });
    } else {
      closeAllDocuments();
      showNotification('All tabs closed', 'info');
      closeAllMenus();
    }
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

            <div className="menu-separator" />

            {driveAuthenticated ? (
              <button className="menu-item" onClick={handleDisconnectDrive}>
                <span>✓ Connected to Google Drive</span>
              </button>
            ) : (
              <button className="menu-item" onClick={handleConnectDrive}>
                <span>Connect to Google Drive</span>
              </button>
            )}
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

      {/* Drive File Picker Dialog */}
      {showDrivePicker && (
        <DriveFilePickerDialog
          onSelect={handleDriveFileSelect}
          onCancel={() => setShowDrivePicker(false)}
        />
      )}

      {/* Password Dialog for decryption or save */}
      {showPasswordDialog && (
        <PasswordDialog
          mode={pendingEncryptedData ? 'decrypt' : 'encrypt'}
          onConfirm={
            pendingDriveFile
              ? handleDriveDecryptPassword
              : pendingEncryptedData
              ? handleDecryptPassword
              : handleSavePassword
          }
          onCancel={() => {
            setShowPasswordDialog(false);
            setPendingEncryptedData(null);
            setPendingDriveFile(null);
            setSaveAsMode(false);
          }}
          filename={
            pendingDriveFile?.filename ||
            pendingEncryptedData?.data.metadata.filename ||
            activeDoc?.metadata.filename
          }
        />
      )}
    </>
  );
};
