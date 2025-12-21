import React, { useState, useEffect } from 'react';
import { listFiles } from '@/services/googleDrive.service';
import './DriveFilePickerDialog.css';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  encrypted?: boolean;
}

export interface DriveFilePickerDialogProps {
  onSelect: (fileId: string, filename: string) => void;
  onCancel: () => void;
}

export const DriveFilePickerDialog: React.FC<DriveFilePickerDialogProps> = ({
  onSelect,
  onCancel,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async (query?: string) => {
    try {
      setLoading(true);
      setError('');
      const fileList = await listFiles(query);
      setFiles(fileList);
    } catch (err) {
      setError('Failed to load Google Drive files. Make sure you are signed in.');
      console.error('Error loading Drive files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadFiles(`name contains '${searchQuery}'`);
    } else {
      loadFiles();
    }
  };

  const handleFileClick = (file: DriveFile) => {
    setSelectedFile(file);
  };

  const handleFileDoubleClick = (file: DriveFile) => {
    onSelect(file.id, file.name);
  };

  const handleOpen = () => {
    if (selectedFile) {
      onSelect(selectedFile.id, selectedFile.name);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatSize = (sizeString?: string) => {
    if (!sizeString) return 'N/A';
    const bytes = parseInt(sizeString, 10);
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="drive-picker-overlay" onClick={onCancel}>
      <div className="drive-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="drive-picker-header">
          <h2>Open from Google Drive</h2>
          <button className="close-button" onClick={onCancel} title="Close">
            ✕
          </button>
        </div>

        <div className="drive-picker-search">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="drive-picker-body">
          {loading && (
            <div className="drive-picker-loading">
              <p>Loading files from Google Drive...</p>
            </div>
          )}

          {error && (
            <div className="drive-picker-error">
              <p>{error}</p>
              <button onClick={() => loadFiles()}>Try Again</button>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="drive-picker-empty">
              <p>No files found in Google Drive</p>
              <small>Upload files to Google Drive to see them here</small>
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="drive-file-list">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`drive-file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
                  onClick={() => handleFileClick(file)}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                >
                  <span className="file-icon">
                    {file.encrypted ? '🔒' : '📄'}
                  </span>
                  <div className="file-details">
                    <div className="file-name">
                      {file.name}
                      {file.encrypted && (
                        <span className="file-badge">Encrypted</span>
                      )}
                    </div>
                    <div className="file-meta">
                      <span>{formatDate(file.modifiedTime)}</span>
                      <span> • </span>
                      <span>{formatSize(file.size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drive-picker-footer">
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
