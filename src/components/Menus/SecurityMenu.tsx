import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { PasswordDialog } from '@/components/Dialogs/PasswordDialog';
import { encryptDocument, decryptFromBinary, isBinaryEncrypted } from '@/services/encryption.service';
import { PlainDocument } from '@/types/document.types';

export const SecurityMenu: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'encrypt' | 'decrypt' | 'change'>('encrypt');

  const { getActiveDocument, updateDocument, activeDocumentId } = useDocumentStore();
  const { closeAllMenus, showNotification } = useUIStore();

  const activeDoc = getActiveDocument();
  const isEncrypted = activeDoc?.encrypted || false;

  const handleEncrypt = () => {
    if (!activeDoc) {
      showNotification('No document to encrypt', 'error');
      return;
    }

    setDialogMode('encrypt');
    setShowPasswordDialog(true);
  };

  const handleDecryptFile = () => {
    if (!activeDoc) {
      showNotification('No document to decrypt', 'error');
      return;
    }

    // Check if the content appears to be binary encrypted
    if (!isBinaryEncrypted(activeDoc.content)) {
      showNotification('This file does not appear to be encrypted', 'warning');
      return;
    }

    setDialogMode('decrypt');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = () => {
    showNotification('Change password coming in next update!', 'info');
    closeAllMenus();
  };

  const handleRemoveEncryption = () => {
    if (!activeDoc || !activeDocumentId) {
      showNotification('No document to decrypt', 'error');
      return;
    }

    if (
      confirm(
        'Remove encryption from this document? It will be saved as plain text and no longer protected.'
      )
    ) {
      updateDocument(activeDocumentId, { encrypted: false });
      showNotification('Encryption removed', 'success');
      closeAllMenus();
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!activeDoc || !activeDocumentId) return;

    try {
      if (dialogMode === 'encrypt') {
        // Create plain document from active document
        const plainDoc: PlainDocument = {
          content: activeDoc.content,
          metadata: activeDoc.metadata,
        };

        // Encrypt the document
        await encryptDocument(plainDoc, password);

        // Update the document store to mark as encrypted
        updateDocument(activeDocumentId, {
          encrypted: true,
          metadata: {
            ...activeDoc.metadata,
            encrypted: true,
            encryptedAt: new Date().toISOString(),
          },
        });

        showNotification('Document encrypted successfully!', 'success');
        closeAllMenus();
      } else if (dialogMode === 'decrypt') {
        // Decrypt the file content
        const decryptedContent = await decryptFromBinary(activeDoc.content, password);

        // Update the document with decrypted content
        updateDocument(activeDocumentId, {
          content: decryptedContent,
          encrypted: false,
          modified: true,
          metadata: {
            ...activeDoc.metadata,
            encrypted: false,
          },
        });

        showNotification('File decrypted successfully!', 'success');
        closeAllMenus();
      }
    } catch (error) {
      console.error('Encryption/Decryption error:', error);
      const operation = dialogMode === 'encrypt' ? 'encrypt' : 'decrypt';
      showNotification(
        error instanceof Error ? error.message : `Failed to ${operation} document`,
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
  };

  return (
    <>
      <div className="menu-section">
        <div className="menu-section-header" onClick={() => setExpanded(!expanded)}>
          <span className="menu-arrow">{expanded ? '▼' : '▶'}</span>
          <span className="menu-section-title">Security</span>
        </div>

        {expanded && (
          <div className="menu-items">
            {!isEncrypted ? (
              <>
                <button className="menu-item" onClick={handleEncrypt}>
                  <span>🔒 Encrypt Document</span>
                  <span className="menu-shortcut">Ctrl+E</span>
                </button>
                <div className="menu-info">
                  <small>
                    Protect this document with AES-256-GCM encryption. You'll need a
                    password to open it later.
                  </small>
                </div>
              </>
            ) : (
              <>
                <div className="menu-info encryption-status">
                  <div style={{ marginBottom: '8px' }}>
                    <strong>🔒 Encrypted</strong>
                  </div>
                  <small>This document is protected with AES-256-GCM encryption.</small>
                </div>

                <div className="menu-separator" />

                <button className="menu-item" onClick={handleChangePassword}>
                  <span>🔑 Change Password</span>
                </button>

                <button className="menu-item" onClick={handleRemoveEncryption}>
                  <span>🔓 Remove Encryption</span>
                </button>

                <div className="menu-info">
                  <small>
                    <strong>Warning:</strong> Removing encryption will save as plain text.
                  </small>
                </div>
              </>
            )}

            <div className="menu-separator" />

            <button className="menu-item" onClick={handleDecryptFile}>
              <span>🔓 Decrypt File</span>
              <span className="menu-shortcut">Ctrl+D</span>
            </button>
            <div className="menu-info">
              <small>
                Decrypt a file without .enc extension. Works on any encrypted file.
              </small>
            </div>
          </div>
        )}
      </div>

      {showPasswordDialog && (
        <PasswordDialog
          mode={dialogMode}
          onConfirm={handlePasswordConfirm}
          onCancel={handlePasswordCancel}
          filename={activeDoc?.metadata.filename}
        />
      )}
    </>
  );
};
