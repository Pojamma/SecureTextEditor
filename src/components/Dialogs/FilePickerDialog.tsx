import React, { useState, useEffect } from 'react';
import { listFiles } from '@/services/filesystem.service';
import './FilePickerDialog.css';

export interface FilePickerDialogProps {
  onSelect: (filename: string) => void;
  onCancel: () => void;
}

export const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
  onSelect,
  onCancel,
}) => {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (filename: string) => {
    setSelectedFile(filename);
  };

  const handleFileDoubleClick = (filename: string) => {
    onSelect(filename);
  };

  const handleOpen = () => {
    if (selectedFile) {
      onSelect(selectedFile);
    }
  };

  const isEncryptedFile = (filename: string) => {
    // Assume .enc or .encrypted extension for encrypted files
    return filename.endsWith('.enc') || filename.endsWith('.encrypted');
  };

  return (
    <div className="file-picker-overlay" onClick={onCancel}>
      <div className="file-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="file-picker-header">
          <h2>Open File</h2>
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
              <p>No files found in Documents folder</p>
              <small>Save a document first to see it here</small>
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="file-list">
              {files.map((filename) => (
                <div
                  key={filename}
                  className={`file-item ${selectedFile === filename ? 'selected' : ''}`}
                  onClick={() => handleFileClick(filename)}
                  onDoubleClick={() => handleFileDoubleClick(filename)}
                >
                  <span className="file-icon">
                    {isEncryptedFile(filename) ? '🔒' : '📄'}
                  </span>
                  <span className="file-name">{filename}</span>
                  {isEncryptedFile(filename) && (
                    <span className="file-badge">Encrypted</span>
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
    </div>
  );
};
