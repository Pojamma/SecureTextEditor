import React from 'react';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showThirdOption?: boolean;
  thirdOptionText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onThirdOption?: () => void;
}

/**
 * Generic confirmation dialog component
 * Supports two or three button options
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showThirdOption = false,
  thirdOptionText = 'Third Option',
  onConfirm,
  onCancel,
  onThirdOption,
}) => {
  if (!isOpen) return null;

  const handleThirdOption = () => {
    if (onThirdOption) {
      onThirdOption();
    }
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-container confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{title}</h2>
          <button className="dialog-close-button" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="dialog-content">
          <p className="confirm-message">{message}</p>
        </div>
        <div className="dialog-footer confirm-dialog-footer">
          {showThirdOption && (
            <button
              className="dialog-button secondary-button"
              onClick={handleThirdOption}
              type="button"
            >
              {thirdOptionText}
            </button>
          )}
          <button className="dialog-button secondary-button" onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button className="dialog-button primary-button" onClick={onConfirm} type="button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
