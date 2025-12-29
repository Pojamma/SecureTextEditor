import React, { useState, useEffect } from 'react';
import { listFiles, readFile, deleteFile, renameFile, copyFile, toggleFileEncryption } from '@/services/filesystem.service';
import './FilePickerDialog.css';

export interface FilePickerDialogProps {
  onSelect: (filename: string) => void;
  onCancel: () => void;
}

interface FileInfo {
  name: string;
  encrypted: boolean;
}

type ActionType = 'rename' | 'copy' | 'delete' | 'encrypt' | 'decrypt';

export const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
  onSelect,
  onCancel,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Action menu state
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Dialog states
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [actionFile, setActionFile] = useState<string | null>(null);

  // Input states
  const [newFilename, setNewFilename] = useState('');
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const fileList = await listFiles();

      // Check each file to see if it's encrypted
      const fileInfoPromises = fileList.map(async (filename) => {
        try {
          const result = await readFile(filename);
          return {
            name: filename,
            encrypted: result.requiresPassword || false,
          };
        } catch (err) {
          // If we can't read the file, assume it's not encrypted
          return {
            name: filename,
            encrypted: false,
          };
        }
      });

      const fileInfos = await Promise.all(fileInfoPromises);
      setFiles(fileInfos);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (filename: string) => {
    setSelectedFile(filename);
    setActiveMenu(null); // Close any open menu
  };

  const handleFileDoubleClick = (filename: string) => {
    onSelect(filename);
  };

  const handleOpen = () => {
    if (selectedFile) {
      onSelect(selectedFile);
    }
  };

  const handleMenuToggle = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === filename ? null : filename);
  };

  const handleAction = (type: ActionType, filename: string) => {
    setActionType(type);
    setActionFile(filename);
    setShowActionDialog(true);
    setActiveMenu(null);
    setNewFilename(type === 'copy' ? `${filename.replace(/\.[^.]+$/, '')} - Copy${filename.match(/\.[^.]+$/)?.[0] || ''}` : filename);
    setPassword('');
    setActionError('');
  };

  const handleActionCancel = () => {
    setShowActionDialog(false);
    setActionType(null);
    setActionFile(null);
    setNewFilename('');
    setPassword('');
    setActionError('');
  };

  const handleActionConfirm = async () => {
    if (!actionFile || !actionType) return;

    try {
      setActionLoading(true);
      setActionError('');

      switch (actionType) {
        case 'rename':
          if (!newFilename.trim()) {
            setActionError('Please enter a filename');
            return;
          }
          if (newFilename === actionFile) {
            setActionError('New filename must be different');
            return;
          }
          await renameFile(actionFile, newFilename);
          break;

        case 'copy':
          if (!newFilename.trim()) {
            setActionError('Please enter a filename');
            return;
          }
          await copyFile(actionFile, newFilename);
          break;

        case 'delete':
          await deleteFile(actionFile);
          break;

        case 'encrypt':
          if (!password.trim()) {
            setActionError('Please enter a password');
            return;
          }
          await toggleFileEncryption(actionFile, password, true);
          break;

        case 'decrypt':
          if (!password.trim()) {
            setActionError('Please enter a password');
            return;
          }
          await toggleFileEncryption(actionFile, password, false);
          break;
      }

      // Success - reload files and close dialog
      await loadFiles();
      handleActionCancel();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'rename': return 'Rename File';
      case 'copy': return 'Copy File';
      case 'delete': return 'Delete File';
      case 'encrypt': return 'Encrypt File';
      case 'decrypt': return 'Decrypt File';
      default: return '';
    }
  };

  const getActionMessage = () => {
    if (!actionFile) return '';

    switch (actionType) {
      case 'delete':
        return `Are you sure you want to delete "${actionFile}"? This action cannot be undone.`;
      case 'encrypt':
        return `Enter a password to encrypt "${actionFile}":`;
      case 'decrypt':
        return `Enter the password to decrypt "${actionFile}":`;
      default:
        return '';
    }
  };

  return (
    <div className="file-picker-overlay" onClick={onCancel}>
      <div className="file-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="file-picker-header">
          <h2>Open Local File</h2>
          <button className="close-button" onClick={onCancel} title="Close">
            ✕
          </button>
        </div>

        <div className="file-picker-body">
          {loading && (
            <div className="file-picker-loading">
              <p>Loading files...</p>
            </div>
          )}

          {error && (
            <div className="file-picker-error">
              <p>{error}</p>
              <button onClick={loadFiles}>Try Again</button>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="file-picker-empty">
              <p>No files found in local storage</p>
              <small>Save a document to local storage first</small>
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="file-list">
              {files.map((file) => (
                <div
                  key={file.name}
                  className={`file-item ${selectedFile === file.name ? 'selected' : ''}`}
                  onClick={() => handleFileClick(file.name)}
                  onDoubleClick={() => handleFileDoubleClick(file.name)}
                >
                  <span className="file-icon">
                    {file.encrypted ? '🔒' : '📄'}
                  </span>
                  <span className="file-name">{file.name}</span>
                  {file.encrypted && (
                    <span className="file-badge">Encrypted</span>
                  )}

                  {/* Action menu button */}
                  <button
                    className="file-action-button"
                    onClick={(e) => handleMenuToggle(file.name, e)}
                    title="Actions"
                  >
                    ⋮
                  </button>

                  {/* Action menu */}
                  {activeMenu === file.name && (
                    <div className="file-action-menu">
                      <button onClick={() => handleAction('rename', file.name)}>
                        ✏️ Rename
                      </button>
                      <button onClick={() => handleAction('copy', file.name)}>
                        📋 Copy
                      </button>
                      <button onClick={() => handleAction('delete', file.name)}>
                        🗑️ Delete
                      </button>
                      <div className="menu-separator" />
                      {file.encrypted ? (
                        <button onClick={() => handleAction('decrypt', file.name)}>
                          🔓 Decrypt
                        </button>
                      ) : (
                        <button onClick={() => handleAction('encrypt', file.name)}>
                          🔒 Encrypt
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="file-picker-footer">
          <button className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={handleOpen}
            disabled={!selectedFile}
          >
            Open
          </button>
        </div>
      </div>

      {/* Action Dialog */}
      {showActionDialog && (
        <div className="action-dialog-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="action-dialog-header">
              <h3>{getActionTitle()}</h3>
              <button className="close-button" onClick={handleActionCancel}>
                ✕
              </button>
            </div>

            <div className="action-dialog-body">
              {actionType === 'delete' && (
                <p className="action-message">{getActionMessage()}</p>
              )}

              {(actionType === 'rename' || actionType === 'copy') && (
                <div className="input-group">
                  <label>New filename:</label>
                  <input
                    type="text"
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    placeholder="Enter filename"
                    autoFocus
                  />
                </div>
              )}

              {(actionType === 'encrypt' || actionType === 'decrypt') && (
                <>
                  <p className="action-message">{getActionMessage()}</p>
                  <div className="input-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoFocus
                    />
                  </div>
                </>
              )}

              {actionError && (
                <div className="action-error">{actionError}</div>
              )}
            </div>

            <div className="action-dialog-footer">
              <button
                className="button-secondary"
                onClick={handleActionCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`button-primary ${actionType === 'delete' ? 'button-danger' : ''}`}
                onClick={handleActionConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' :
                  actionType === 'delete' ? 'Delete' :
                  actionType === 'rename' ? 'Rename' :
                  actionType === 'copy' ? 'Copy' :
                  actionType === 'encrypt' ? 'Encrypt' :
                  'Decrypt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
