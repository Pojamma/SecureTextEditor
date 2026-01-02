import React from 'react';
import { RecentFileEntry } from '@/services/recentFiles.service';
import './RecentFilesDialog.css';

export interface RecentFilesDialogProps {
  recentFiles: RecentFileEntry[];
  onSelect: (file: RecentFileEntry) => void;
  onClear: () => void;
  onCancel: () => void;
}

export const RecentFilesDialog: React.FC<RecentFilesDialogProps> = ({
  recentFiles,
  onSelect,
  onClear,
  onCancel,
}) => {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-container recent-files-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Recent Files</h2>
          <button
            type="button"
            className="dialog-close-button"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="dialog-content">
          {recentFiles.length === 0 ? (
            <div className="recent-files-empty">
              <p>No recent files yet</p>
              <p className="recent-files-empty-hint">
                Files you open will appear here for quick access
              </p>
            </div>
          ) : (
            <div className="recent-files-list">
              {recentFiles.map((file, index) => (
                <button
                  key={`${file.path}-${index}`}
                  className="recent-file-item"
                  onClick={() => onSelect(file)}
                >
                  <div className="recent-file-info">
                    <span className="recent-file-name">{file.filename}</span>
                    <div className="recent-file-badges">
                      {file.source === 'external' && (
                        <span className="recent-file-badge" title="External file">
                          📱 Device
                        </span>
                      )}
                      {file.source === 'drive' && (
                        <span className="recent-file-badge" title="Google Drive">
                          ☁️ Drive
                        </span>
                      )}
                      {file.source === 'local' && (
                        <span className="recent-file-badge recent-file-badge-local" title="Local storage">
                          💾 Local
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="recent-file-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {recentFiles.length > 0 && (
            <button
              type="button"
              className="dialog-button dialog-button-secondary"
              onClick={onClear}
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            className="dialog-button dialog-button-primary"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
