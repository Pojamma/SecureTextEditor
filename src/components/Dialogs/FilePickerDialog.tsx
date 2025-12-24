import React, { useState, useEffect } from 'react';
import { listFiles, readFile } from '@/services/filesystem.service';
import './FilePickerDialog.css';

export interface FilePickerDialogProps {
  onSelect: (filename: string) => void;
  onCancel: () => void;
}

interface FileInfo {
  name: string;
  encrypted: boolean;
}

export const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
  onSelect,
  onCancel,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
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
  };

  const handleFileDoubleClick = (filename: string) => {
    onSelect(filename);
  };

  const handleOpen = () => {
    if (selectedFile) {
      onSelect(selectedFile);
    }
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
