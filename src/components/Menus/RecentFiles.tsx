import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { SessionService } from '@/services/session.service';
import { readFile, decryptFile, readExternalFile, decryptExternalFile, checkExternalFileAccess } from '@/services/filesystem.service';
import { EncryptedDocument } from '@/types/document.types';
import { PasswordDialog } from '@/components/Dialogs/PasswordDialog';
import './Menu.css';

interface RecentFile {
  filename: string;
  path: string;
  source: 'local' | 'drive' | 'external' | 'temp';
  externalUri?: string;
  modified?: string;
}

export const RecentFiles: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
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

  // Load recent files from session
  React.useEffect(() => {
    const session = SessionService.loadSession();
    if (session && session.documents.length > 0) {
      const files: RecentFile[] = session.documents
        .filter(doc => doc.path) // Only files that have been saved
        .map(doc => ({
          filename: doc.metadata.filename,
          path: doc.path,
          source: doc.source,
          externalUri: doc.externalUri,
          modified: doc.metadata.modified,
        }))
        .slice(0, 10); // Show last 10 files
      setRecentFiles(files);
    }
  }, []);

  const handleOpenRecentFile = async (file: RecentFile) => {
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
              recentFiles.map((file, index) => (
                <button
                  key={`${file.path}-${index}`}
                  className="menu-item"
                  onClick={() => handleOpenRecentFile(file)}
                >
                  <span>{file.filename}</span>
                  {file.source === 'external' && <span className="menu-badge">📱</span>}
                  {file.source === 'drive' && <span className="menu-badge">☁️</span>}
                </button>
              ))
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
