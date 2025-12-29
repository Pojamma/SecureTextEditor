import React, { useState, useEffect } from 'react';
import { validatePassword } from '@/services/encryption.service';
import './PasswordDialog.css';

export interface PasswordDialogProps {
  mode: 'encrypt' | 'decrypt' | 'change';
  onConfirm: (password: string, newPassword?: string) => void;
  onCancel: () => void;
  filename?: string;
}

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  mode,
  onConfirm,
  onCancel,
  filename,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    message: string;
  } | null>(null);

  // Clear all password state from memory
  const clearPasswordState = () => {
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    setPasswordStrength(null);
  };

  // Calculate password strength for encryption/change modes
  useEffect(() => {
    if (mode === 'encrypt' || mode === 'change') {
      const targetPassword = mode === 'change' ? newPassword : password;
      if (targetPassword) {
        setPasswordStrength(validatePassword(targetPassword));
      } else {
        setPasswordStrength(null);
      }
    }
  }, [password, newPassword, mode]);

  // Clean up password state when component unmounts
  useEffect(() => {
    return () => {
      clearPasswordState();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Decrypt mode - just need password
    if (mode === 'decrypt') {
      if (!password) {
        setError('Please enter the password');
        return;
      }
      onConfirm(password);
      clearPasswordState(); // Clear password from memory after use
      return;
    }

    // Encrypt mode - need password and confirmation
    if (mode === 'encrypt') {
      if (!password) {
        setError('Please enter a password');
        return;
      }
      if (password.length < 3) {
        setError('Password must be at least 3 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      onConfirm(password);
      clearPasswordState(); // Clear password from memory after use
      return;
    }

    // Change mode - need old password, new password, and confirmation
    if (mode === 'change') {
      if (!password) {
        setError('Please enter your current password');
        return;
      }
      if (!newPassword) {
        setError('Please enter a new password');
        return;
      }
      if (newPassword.length < 3) {
        setError('New password must be at least 3 characters long');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('New passwords do not match');
        return;
      }
      if (password === newPassword) {
        setError('New password must be different from current password');
        return;
      }
      onConfirm(password, newPassword);
      clearPasswordState(); // Clear passwords from memory after use
      return;
    }
  };

  const handleCancel = () => {
    clearPasswordState(); // Clear password from memory on cancel
    onCancel();
  };

  const getTitle = () => {
    switch (mode) {
      case 'encrypt':
        return 'Encrypt Document';
      case 'decrypt':
        return 'Decrypt Document';
      case 'change':
        return 'Change Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'encrypt':
        return 'Create a password to encrypt this document. You will need this password to open the file.';
      case 'decrypt':
        return `Enter the password to decrypt "${filename || 'this document'}".`;
      case 'change':
        return 'Enter your current password and choose a new password.';
    }
  };

  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'strong':
        return '#4caf50';
    }
  };

  return (
    <div className="password-dialog-overlay" onClick={handleCancel}>
      <div className="password-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="password-dialog-header">
          <h2>{getTitle()}</h2>
          <button className="close-button" onClick={handleCancel} title="Close">
            ✕
          </button>
        </div>

        <div className="password-dialog-body">
          <p className="password-dialog-description">{getDescription()}</p>

          {mode === 'encrypt' && (
            <div className="password-warning">
              <strong>⚠️ Important:</strong> If you forget your password, you will not be
              able to recover your data. There is no password recovery option.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Current password (for decrypt and change modes) */}
            {(mode === 'decrypt' || mode === 'change') && (
              <div className="form-group">
                <label htmlFor="password">
                  {mode === 'change' ? 'Current Password' : 'Password'}
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            {/* New password (for encrypt mode) */}
            {mode === 'encrypt' && (
              <>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (min 3 characters)"
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="password-strength">
                      <div
                        className="strength-bar"
                        style={{
                          width:
                            passwordStrength.strength === 'weak'
                              ? '33%'
                              : passwordStrength.strength === 'medium'
                              ? '66%'
                              : '100%',
                          backgroundColor: getStrengthColor(passwordStrength.strength),
                        }}
                      />
                      <span
                        className="strength-text"
                        style={{ color: getStrengthColor(passwordStrength.strength) }}
                      >
                        {passwordStrength.message}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {/* New password fields (for change mode) */}
            {mode === 'change' && (
              <>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 3 characters)"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="password-strength">
                      <div
                        className="strength-bar"
                        style={{
                          width:
                            passwordStrength.strength === 'weak'
                              ? '33%'
                              : passwordStrength.strength === 'medium'
                              ? '66%'
                              : '100%',
                          backgroundColor: getStrengthColor(passwordStrength.strength),
                        }}
                      />
                      <span
                        className="strength-text"
                        style={{ color: getStrengthColor(passwordStrength.strength) }}
                      >
                        {passwordStrength.message}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    id="confirmNewPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="dialog-actions">
              <button type="button" className="button-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                {mode === 'decrypt' ? 'Decrypt' : mode === 'encrypt' ? 'Encrypt' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
