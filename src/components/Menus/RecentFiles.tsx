import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { RecentFilesService, RecentFileEntry } from '@/services/recentFiles.service';
import { readFile, decryptFile, readExternalFile, decryptExternalFile, checkExternalFileAccess } from '@/services/filesystem.service';
import { EncryptedDocument } from '@/types/document.types';
import { PasswordDialog } from '@/components/Dialogs/PasswordDialog';
import './Menu.css';

export const RecentFiles: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [recentFiles, setRecentFiles] = useState<RecentFileEntry[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingEncryptedData, setPendingEncryptedData] = useState<{
    data: EncryptedDocument;
    path: string;
  } | null>(null);
  const [pendingExternalFile, setPendingExternalFile] = useState<{
    data: EncryptedDocument | string;
    uri: string;
    filename: string;
  } | null>(null);

  const { addDocument, setActiveDocument, documents } = useDocumentStore();
  const { closeAllMenus, showNotification } = useUIStore();

  // Load recent files from persistent storage
  // Uses separate storage from open documents, so files remain after closing tabs
  const loadRecentFiles = React.useCallback(() => {
    const files = RecentFilesService.getRecentFiles();
    setRecentFiles(files);
  }, []);

  // Load on mount and when documents change (to refresh if new files opened)
  React.useEffect(() => {
    loadRecentFiles();
  }, [documents, loadRecentFiles]);

  const handleOpenRecentFile = async (file: RecentFileEntry) => {
    try {
      // Check if file is already open
      const existingDoc = documents.find(doc =>
        doc.path === file.path ||
        (file.source === 'external' && doc.externalUri === file.externalUri)
      );

      if (existingDoc) {
        setActiveDocument(existingDoc.id);
        showNotification(`Switched to "${file.filename}"`, 'info');
        closeAllMenus();
        return;
      }

      if (file.source === 'external') {
        // For external files, check if still accessible
        if (!file.externalUri) {
          showNotification('External file URI not available', 'error');
          return;
        }

        const accessible = await checkExternalFileAccess(file.externalUri);
        if (!accessible) {
          showNotification(`File "${file.filename}" is no longer accessible`, 'warning');
          return;
        }

        const result = await readExternalFile();

        if (result.requiresPassword && result.encryptedData) {
          setPendingExternalFile({
            data: result.encryptedData,
            uri: result.document.externalUri || '',
            filename: result.document.metadata.filename,
          });
          setShowPasswordDialog(true);
        } else {
          addDocument(result.document);
          showNotification(`Opened "${file.filename}" from device`, 'success');
          closeAllMenus();
        }
      } else if (file.source === 'local') {
        const result = await readFile(file.path);

        if (result.requiresPassword && result.encryptedData) {
          setPendingEncryptedData({
            data: result.encryptedData,
            path: file.path,
          });
          setShowPasswordDialog(true);
        } else {
          addDocument(result.document);
          showNotification(`Opened "${file.filename}"`, 'success');
          closeAllMenus();
        }
      } else {
        showNotification('Opening from Google Drive... Use File → Open from Google Drive', 'info');
        closeAllMenus();
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to open file',
        'error'
      );
    }
  };

  const handleClearRecentFiles = () => {
    RecentFilesService.clearRecentFiles();
    loadRecentFiles();
    showNotification('Recent files cleared', 'info');
  };

  const handleDecryptPassword = async (password: string) => {
    if (pendingEncryptedData) {
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
    } else if (pendingExternalFile) {
      try {
        const document = await decryptExternalFile(
          pendingExternalFile.data,
          password,
          pendingExternalFile.filename,
          pendingExternalFile.uri
        );
        addDocument(document);
        showNotification(
          `Opened and decrypted "${pendingExternalFile.filename}" from device`,
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
        setPendingExternalFile(null);
      }
    }
  };

  return (
    <>
      <div className="menu-section">
        <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
          <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
          <span className="menu-section-title">Recent Files</span>
        </div>
        {expanded && (
          <div className="menu-items">
            {recentFiles.length === 0 ? (
              <div className="menu-info">
                <small>No recent files</small>
              </div>
            ) : (
              <>
                {recentFiles.map((file, index) => (
                  <button
                    key={`${file.path}-${index}`}
                    className="menu-item"
                    onClick={() => handleOpenRecentFile(file)}
                  >
                    <span>{file.filename}</span>
                    {file.source === 'external' && <span className="menu-badge">📱</span>}
                    {file.source === 'drive' && <span className="menu-badge">☁️</span>}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                  <button
                    className="menu-item"
                    onClick={handleClearRecentFiles}
                    style={{ color: 'var(--error)', fontSize: '0.9em' }}
                  >
                    Clear Recent Files
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showPasswordDialog && (
        <PasswordDialog
          mode="decrypt"
          onConfirm={handleDecryptPassword}
          onCancel={() => {
            setShowPasswordDialog(false);
            setPendingEncryptedData(null);
            setPendingExternalFile(null);
          }}
          filename={
            pendingExternalFile?.filename ||
            pendingEncryptedData?.data.metadata.filename
          }
        />
      )}
    </>
  );
};
