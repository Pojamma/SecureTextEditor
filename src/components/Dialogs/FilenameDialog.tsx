import React, { useState, useEffect } from 'react';
import './PasswordDialog.css'; // Reuse the same styles

export interface FilenameDialogProps {
  suggestedFilename: string;
  onConfirm: (filename: string) => void;
  onCancel: () => void;
}

export const FilenameDialog: React.FC<FilenameDialogProps> = ({
  suggestedFilename,
  onConfirm,
  onCancel,
}) => {
  const [filename, setFilename] = useState(suggestedFilename);
  const [error, setError] = useState('');

  // Initialize with suggested filename
  useEffect(() => {
    setFilename(suggestedFilename);
  }, [suggestedFilename]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!filename || filename.trim() === '') {
      setError('Please enter a filename');
      return;
    }

    // Basic validation - no invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      setError('Filename contains invalid characters');
      return;
    }

    onConfirm(filename.trim());
  };

  const handleCancel = () => {
    setFilename('');
    setError('');
    onCancel();
  };

  return (
    <div className="password-dialog-overlay" onClick={handleCancel}>
      <div className="password-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="password-dialog-header">
          <h2>Save As</h2>
          <button className="close-button" onClick={handleCancel} title="Close">
            ✕
          </button>
        </div>

        <div className="password-dialog-body">
          <p className="password-dialog-description">
            Enter a filename for the new document.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="filename">Filename</label>
              <input
                id="filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="dialog-actions">
              <button type="button" className="button-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
