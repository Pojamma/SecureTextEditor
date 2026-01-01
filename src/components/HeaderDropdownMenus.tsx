import React, { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateId, formatDate } from '@/utils/helpers';
import { OpenDocument, EncryptedDocument, PlainDocument } from '@/types/document.types';
import { FilePickerDialog } from '@/components/Dialogs/FilePickerDialog';
import { DriveFilePickerDialog } from '@/components/Dialogs/DriveFilePickerDialog';
import { PasswordDialog } from '@/components/Dialogs/PasswordDialog';
import { FilenameDialog } from '@/components/Dialogs/FilenameDialog';
import { readFile, decryptFile, saveFile, saveFileAs, readExternalFile, decryptExternalFile, saveExternalFile, saveAsToDevice } from '@/services/filesystem.service';
import {
  isAuthenticated,
  signIn,
  signOut,
  downloadFile
} from '@/services/googleDrive.service';
import { isEncrypted, decryptDocument, encryptDocument, decryptFromBinary, isBinaryEncrypted } from '@/services/encryption.service';
import {
  sortLines,
  removeDuplicateLines,
  convertToUpperCase,
  convertToLowerCase,
  convertToTitleCase,
  trimWhitespace,
  removeEmptyLines,
} from '@/utils/textUtils';
import { exportAsText, exportAsHTML, shareDocument, copyToClipboard } from '@/utils/exportUtils';
import './HeaderDropdownMenus.css';

type MenuType = 'file' | 'edit' | 'tools' | 'more' | null;

export const HeaderDropdownMenus: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showInsertSubmenu, setShowInsertSubmenu] = useState(false);
  const [showConvertCaseSubmenu, setShowConvertCaseSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const insertSubmenuRef = useRef<HTMLDivElement>(null);
  const convertCaseSubmenuRef = useRef<HTMLDivElement>(null);

  // File menu state
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showFilenameDialog, setShowFilenameDialog] = useState(false);
  const [suggestedFilename, setSuggestedFilename] = useState('');
  const [passwordForSaveAs, setPasswordForSaveAs] = useState<string | undefined>();
  const [pendingEncryptedData, setPendingEncryptedData] = useState<{
    data: EncryptedDocument;
    path: string;
  } | null>(null);
  const [saveAsMode, setSaveAsMode] = useState(false);
  const [saveAsToDeviceMode, setSaveAsToDeviceMode] = useState(false);
  const [driveAuthenticated, setDriveAuthenticated] = useState(false);
  const [pendingDriveFile, setPendingDriveFile] = useState<{
    fileId: string;
    filename: string;
  } | null>(null);
  const [pendingExternalFile, setPendingExternalFile] = useState<{
    data: EncryptedDocument | string;
    uri: string;
    filename: string;
  } | null>(null);

  // Security menu state
  const [dialogMode, setDialogMode] = useState<'encrypt' | 'decrypt' | 'change'>('encrypt');

  const { addDocument, closeDocument, closeAllDocuments, documents, hasUnsavedChanges, getActiveDocument, updateDocument, setActiveDocument, activeDocumentId } =
    useDocumentStore();
  const { editorActions, showNotification, openDialog, showSearchAllTabs, showConfirmDialog } = useUIStore();
  const { toggleStatusBar, toggleSpecialChars, specialCharsVisible } = useSettingsStore();

  const activeDoc = getActiveDocument();

  // Check Drive authentication status
  useEffect(() => {
    isAuthenticated().then(setDriveAuthenticated);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setShowInsertSubmenu(false);
        setShowConvertCaseSubmenu(false);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenu]);

  const toggleMenu = (menu: MenuType, buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (openMenu === menu) {
      setOpenMenu(null);
      setShowInsertSubmenu(false);
      setShowConvertCaseSubmenu(false);
    } else {
      // Calculate position based on button location
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 4, // 4px gap below button
          left: rect.left,
        });
      }
      setOpenMenu(menu);
      setShowInsertSubmenu(false);
      setShowConvertCaseSubmenu(false);
    }
  };

  const closeMenu = () => {
    setOpenMenu(null);
    setShowInsertSubmenu(false);
    setShowConvertCaseSubmenu(false);
  };

  const calculateSubmenuPosition = (triggerRef: React.RefObject<HTMLDivElement>) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right - 2, // Slight overlap to prevent gap
      });
    }
  };

  const handleSubmenuMouseEnter = (submenu: 'insert' | 'convertCase', triggerRef: React.RefObject<HTMLDivElement>) => {
    // Clear any pending timeout
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }

    if (submenu === 'insert') {
      setShowInsertSubmenu(true);
    } else {
      setShowConvertCaseSubmenu(true);
    }
    calculateSubmenuPosition(triggerRef);
  };

  const handleSubmenuMouseLeave = (submenu: 'insert' | 'convertCase') => {
    // Delay hiding to allow mouse to move to submenu
    submenuTimeoutRef.current = setTimeout(() => {
      if (submenu === 'insert') {
        setShowInsertSubmenu(false);
      } else {
        setShowConvertCaseSubmenu(false);
      }
    }, 150); // 150ms delay
  };

  const handleAction = (action: (() => void) | undefined, actionName: string) => {
    if (action) {
      action();
      closeMenu();
    } else {
      console.warn(`${actionName} action not available`);
      closeMenu();
    }
  };

  // File menu actions
  const handleNewDocument = () => {
    const newDoc: OpenDocument = {
      id: generateId(),
      path: '',
      source: 'temp',
      encrypted: false,
      content: '',
      modified: false,
      cursorPosition: 0,
      scrollPosition: 0,
      metadata: {
        created: formatDate(),
        modified: formatDate(),
        filename: 'Untitled.txt',
      },
    };
    addDocument(newDoc);
    showNotification('New document created', 'success');
    closeMenu();
  };

  const handleOpenLocal = () => {
    setShowFilePicker(true);
    closeMenu();
  };

  const handleFileSelect = async (filename: string) => {
    setShowFilePicker(false);
    try {
      const existingDoc = documents.find(doc => doc.path === filename);
      if (existingDoc) {
        setActiveDocument(existingDoc.id);
        showNotification(`Switched to "${filename}"`, 'info');
        return;
      }

      const result = await readFile(filename);

      if (result.requiresPassword && result.encryptedData) {
        setPendingEncryptedData({
          data: result.encryptedData,
          path: filename,
        });
        setShowPasswordDialog(true);
      } else {
        addDocument(result.document);
        showNotification(`Opened "${filename}"`, 'success');
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to open file',
        'error'
      );
    }
  };

  const handleDecryptPassword = async (password: string) => {
    if (!pendingEncryptedData) return;

    try {
      const document = await decryptFile(
        pendingEncryptedData.data,
        password,
        pendingEncryptedData.path
      );
      addDocument(document);
      showNotification(`Opened and decrypted "${document.metadata.filename}"`, 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Decryption failed',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setPendingEncryptedData(null);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const success = await signIn();
      if (success) {
        setDriveAuthenticated(true);
        showNotification('Connected to Google Drive!', 'success');
      } else {
        showNotification('Failed to connect to Google Drive', 'error');
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to connect to Google Drive',
        'error'
      );
    }
    closeMenu();
  };

  const handleDisconnectDrive = async () => {
    try {
      await signOut();
      setDriveAuthenticated(false);
      showNotification('Disconnected from Google Drive', 'info');
    } catch (error) {
      showNotification('Failed to disconnect from Google Drive', 'error');
    }
    closeMenu();
  };

  const handleOpenDrive = async () => {
    if (!driveAuthenticated) {
      showNotification('Please connect to Google Drive first', 'warning');
      handleConnectDrive();
      return;
    }
    setShowDrivePicker(true);
    closeMenu();
  };

  const handleDriveFileSelect = async (fileId: string, filename: string) => {
    setShowDrivePicker(false);
    try {
      const existingDoc = documents.find(doc => doc.path === fileId);
      if (existingDoc) {
        setActiveDocument(existingDoc.id);
        showNotification(`Switched to "${filename}"`, 'info');
        return;
      }

      const content = await downloadFile(fileId);

      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch {
        parsedData = null;
      }

      if (parsedData && isEncrypted(parsedData)) {
        setPendingDriveFile({ fileId, filename });
        setPendingEncryptedData({
          data: parsedData,
          path: fileId,
        });
        setShowPasswordDialog(true);
      } else if (parsedData && 'content' in parsedData && 'metadata' in parsedData) {
        const plainDoc = parsedData as PlainDocument;
        const document: OpenDocument = {
          id: generateId(),
          path: fileId,
          source: 'drive',
          encrypted: false,
          content: plainDoc.content,
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: plainDoc.metadata,
        };
        addDocument(document);
        showNotification(`Opened "${filename}" from Google Drive`, 'success');
      } else {
        const document: OpenDocument = {
          id: generateId(),
          path: fileId,
          source: 'drive',
          encrypted: false,
          content: content,
          modified: false,
          cursorPosition: 0,
          scrollPosition: 0,
          metadata: {
            filename: filename,
            created: formatDate(),
            modified: formatDate(),
          },
        };
        addDocument(document);
        showNotification(`Opened "${filename}" from Google Drive`, 'success');
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to open file from Google Drive',
        'error'
      );
    }
  };

  const handleDriveDecryptPassword = async (password: string) => {
    if (!pendingEncryptedData || !pendingDriveFile) return;

    try {
      const plainDoc = await decryptDocument(pendingEncryptedData.data, password);
      const document: OpenDocument = {
        id: generateId(),
        path: pendingDriveFile.fileId,
        source: 'drive',
        encrypted: true,
        content: plainDoc.content,
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: plainDoc.metadata,
      };
      addDocument(document);
      showNotification(
        `Opened and decrypted "${pendingDriveFile.filename}" from Google Drive`,
        'success'
      );
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Decryption failed',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setPendingEncryptedData(null);
      setPendingDriveFile(null);
    }
  };

  const handleOpenExternal = async () => {
    try {
      const result = await readExternalFile();

      const existingDoc = documents.find(
        (doc) => doc.source === 'external' && doc.externalUri === result.document.externalUri
      );
      if (existingDoc) {
        setActiveDocument(existingDoc.id);
        showNotification(`Switched to "${result.document.metadata.filename}"`, 'info');
        return;
      }

      if (result.requiresPassword && result.encryptedData) {
        setPendingExternalFile({
          data: result.encryptedData,
          uri: result.document.externalUri || '',
          filename: result.document.metadata.filename,
        });
        setShowPasswordDialog(true);
      } else {
        addDocument(result.document);
        showNotification(`Opened "${result.document.metadata.filename}" from device`, 'success');
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to open file from device',
        'error'
      );
    }
    closeMenu();
  };

  const handleExternalDecryptPassword = async (password: string) => {
    if (!pendingExternalFile) return;

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
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Decryption failed',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setPendingExternalFile(null);
    }
  };

  const handleSave = async () => {
    if (!activeDoc) {
      showNotification('No active document to save', 'error');
      return;
    }

    if (!activeDoc.path) {
      handleSaveAs();
      return;
    }

    try {
      if (activeDoc.encrypted) {
        setSaveAsMode(false);
        setShowPasswordDialog(true);
      } else {
        if (activeDoc.source === 'external') {
          const result = await saveExternalFile(activeDoc);
          const updates: any = { modified: false };
          if (result.newUri) {
            updates.externalUri = result.newUri;
          }
          if (result.newFilename) {
            updates.metadata = { ...activeDoc.metadata, filename: result.newFilename };
            updates.path = result.newFilename;
          }
          if (activeDocumentId) {
            updateDocument(activeDocumentId, updates);
          }
          showNotification(
            `Saved "${result.newFilename || activeDoc.metadata.filename}"`,
            'success'
          );
        } else {
          await saveFile(activeDoc);
          if (activeDocumentId) {
            updateDocument(activeDocumentId, { modified: false });
          }
          showNotification(`Saved "${activeDoc.metadata.filename}"`, 'success');
        }
        closeMenu();
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    }
  };

  const handleSaveAs = () => {
    if (!activeDoc) {
      showNotification('No active document to save', 'error');
      return;
    }

    if (activeDoc.encrypted) {
      setSaveAsMode(true);
      setShowPasswordDialog(true);
    } else {
      setSuggestedFilename(activeDoc.metadata.filename);
      setPasswordForSaveAs(undefined);
      setShowFilenameDialog(true);
    }
    closeMenu();
  };

  const handleSaveAsToDevice = () => {
    if (!activeDoc) {
      showNotification('No active document to save', 'error');
      return;
    }

    if (activeDoc.encrypted) {
      setSaveAsToDeviceMode(true);
      setShowPasswordDialog(true);
    } else {
      performSaveAsToDevice(undefined);
    }
    closeMenu();
  };

  const handleFilenameConfirm = async (filename: string) => {
    if (!filename || !activeDoc) return;

    try {
      let finalFilename = filename;
      if (passwordForSaveAs && !finalFilename.toLowerCase().endsWith('.enc')) {
        // Append .enc to filename (keep original extension)
        finalFilename = finalFilename + '.enc';
      }

      await performSaveAs(finalFilename, passwordForSaveAs);
      setShowFilenameDialog(false);
      setSaveAsMode(false);
      setPasswordForSaveAs(undefined);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    }
  };

  const performSaveAs = async (newFilename: string, password?: string) => {
    if (!activeDoc || !activeDocumentId) return;

    try {
      const newPath = await saveFileAs(activeDoc, newFilename, password);
      updateDocument(activeDocumentId, {
        path: newPath,
        modified: false,
        metadata: {
          ...activeDoc.metadata,
          filename: newFilename,
        },
      });
      showNotification(`Saved as "${newFilename}"`, 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    }
  };

  const performSaveAsToDevice = async (password?: string) => {
    if (!activeDoc || !activeDocumentId) return;

    try {
      const result = await saveAsToDevice(activeDoc, password);

      updateDocument(activeDocumentId, {
        path: result.filename,
        source: 'external',
        externalUri: result.uri,
        modified: false,
        encrypted: !!password,
        metadata: {
          ...activeDoc.metadata,
          filename: result.filename,
        },
      });

      showNotification(`Saved to device as "${result.filename}"`, 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save to device',
        'error'
      );
    }
  };

  const handleSavePassword = async (password: string) => {
    if (!activeDoc) return;

    try {
      if (saveAsToDeviceMode) {
        await performSaveAsToDevice(password);
        setShowPasswordDialog(false);
        setSaveAsToDeviceMode(false);
      } else if (saveAsMode) {
        let filename = activeDoc.metadata.filename;
        if (password && !filename.toLowerCase().endsWith('.enc')) {
          // Append .enc to filename (keep original extension)
          filename = filename + '.enc';
        }

        setSuggestedFilename(filename);
        setPasswordForSaveAs(password);
        setShowPasswordDialog(false);
        setShowFilenameDialog(true);
      } else {
        if (activeDoc.source === 'external') {
          const result = await saveExternalFile(activeDoc, password);
          const updates: any = { modified: false };
          if (result.newUri) {
            updates.externalUri = result.newUri;
          }
          if (result.newFilename) {
            updates.metadata = { ...activeDoc.metadata, filename: result.newFilename };
            updates.path = result.newFilename;
          }
          if (activeDocumentId) {
            updateDocument(activeDocumentId, updates);
          }
          showNotification(
            `Saved "${result.newFilename || activeDoc.metadata.filename}"`,
            'success'
          );
        } else {
          await saveFile(activeDoc, password);
          if (activeDocumentId) {
            updateDocument(activeDocumentId, { modified: false });
          }
          showNotification(`Saved "${activeDoc.metadata.filename}"`, 'success');
        }
        closeMenu();
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save file',
        'error'
      );
    } finally {
      setShowPasswordDialog(false);
      setSaveAsMode(false);
    }
  };

  const handleSaveAll = async () => {
    const modifiedDocs = documents.filter(doc => doc.modified);

    if (modifiedDocs.length === 0) {
      showNotification('No modified documents to save', 'info');
      closeMenu();
      return;
    }

    try {
      let savedCount = 0;
      let failedCount = 0;

      for (const doc of modifiedDocs) {
        try {
          if (!doc.path || doc.encrypted) {
            continue;
          }

          if (doc.source === 'external') {
            const result = await saveExternalFile(doc);
            const updates: any = { modified: false };
            if (result.newUri) {
              updates.externalUri = result.newUri;
            }
            if (result.newFilename) {
              updates.metadata = { ...doc.metadata, filename: result.newFilename };
              updates.path = result.newFilename;
            }
            updateDocument(doc.id, updates);
          } else {
            await saveFile(doc);
            updateDocument(doc.id, { modified: false });
          }
          savedCount++;
        } catch (error) {
          console.error(`Failed to save ${doc.metadata.filename}:`, error);
          failedCount++;
        }
      }

      if (savedCount > 0) {
        showNotification(`Saved ${savedCount} document(s)`, 'success');
      }
      if (failedCount > 0) {
        showNotification(`Failed to save ${failedCount} document(s)`, 'warning');
      }
      closeMenu();
    } catch (error) {
      showNotification('Failed to save all documents', 'error');
    }
  };

  const handleCloseTab = () => {
    if (documents.length > 0 && documents[0]) {
      closeDocument(documents[0].id);
      showNotification('Tab closed', 'info');
    }
    closeMenu();
  };

  const handleCloseAll = () => {
    if (hasUnsavedChanges()) {
      const modifiedDocs = documents.filter(doc => doc.modified);
      showConfirmDialog({
        title: 'Close All Tabs?',
        message: `You have ${modifiedDocs.length} unsaved document(s). Do you want to save before closing all?`,
        confirmText: 'Save All',
        cancelText: 'Cancel',
        showThirdOption: true,
        thirdOptionText: "Close Without Saving",
        onConfirm: async () => {
          await handleSaveAll();
          closeAllDocuments();
          showNotification('All tabs closed', 'info');
        },
        onCancel: () => {
          // Do nothing
        },
        onThirdOption: () => {
          closeAllDocuments();
          showNotification('All tabs closed without saving', 'info');
        },
      });
    } else {
      closeAllDocuments();
      showNotification('All tabs closed', 'info');
    }
    closeMenu();
  };

  // Export menu actions
  const handleExportText = () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      exportAsText(activeDoc.metadata.filename, activeDoc.content);
      showNotification('Document exported as text file', 'success');
      closeMenu();
    } catch (error) {
      showNotification('Failed to export document', 'error');
    }
  };

  const handleExportHTML = () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      exportAsHTML(activeDoc.metadata.filename, activeDoc.content);
      showNotification('Document exported as HTML file', 'success');
      closeMenu();
    } catch (error) {
      showNotification('Failed to export as HTML', 'error');
    }
  };

  const handleShare = async () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      const shared = await shareDocument(
        activeDoc.metadata.filename,
        activeDoc.content
      );

      if (shared) {
        showNotification('Document shared', 'success');
      }
      closeMenu();
    } catch (error) {
      showNotification('Failed to share document', 'error');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }

    try {
      await copyToClipboard(activeDoc.content, activeDoc.encrypted);
      const message = activeDoc.encrypted
        ? 'Content copied (will be cleared in 30 seconds)'
        : 'Content copied to clipboard';
      showNotification(message, 'success');
      closeMenu();
    } catch (error) {
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  // Security menu actions
  const handleEncryptDocument = () => {
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

    if (!isBinaryEncrypted(activeDoc.content)) {
      showNotification('This file does not appear to be encrypted', 'warning');
      return;
    }

    setDialogMode('decrypt');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = () => {
    showNotification('Change password coming in next update!', 'info');
    closeMenu();
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
      closeMenu();
    }
  };

  const handleSecurityPasswordConfirm = async (password: string) => {
    if (!activeDoc || !activeDocumentId) return;

    try {
      if (dialogMode === 'encrypt') {
        const plainDoc: PlainDocument = {
          content: activeDoc.content,
          metadata: activeDoc.metadata,
        };

        await encryptDocument(plainDoc, password);

        updateDocument(activeDocumentId, {
          encrypted: true,
          metadata: {
            ...activeDoc.metadata,
            encrypted: true,
            encryptedAt: new Date().toISOString(),
          },
        });

        showNotification('Document encrypted successfully!', 'success');
        closeMenu();
      } else if (dialogMode === 'decrypt') {
        const decryptedContent = await decryptFromBinary(activeDoc.content, password);

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
        closeMenu();
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

  // Insert menu actions
  const handleInsertDate = (format: 'short' | 'long' | 'iso' | 'time' | 'datetime') => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }

    const now = new Date();
    let dateString = '';

    switch (format) {
      case 'short':
        dateString = now.toLocaleDateString('en-US');
        break;
      case 'long':
        dateString = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        break;
      case 'iso':
        dateString = now.toISOString().split('T')[0];
        break;
      case 'time':
        dateString = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        break;
      case 'datetime':
        dateString = `${now.toLocaleDateString('en-US')} ${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
        break;
    }

    const newContent = activeDoc.content + dateString;
    updateDocument(activeDoc.id, { content: newContent });
    showNotification('Date/time inserted', 'success');
    closeMenu();
  };

  const handleInsertSpecialChar = () => {
    openDialog('specialCharDialog');
    closeMenu();
  };

  // Tools menu actions
  const handleShowStatistics = () => {
    openDialog('statisticsDialog');
    closeMenu();
  };

  const handleSortLines = () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }
    const sorted = sortLines(activeDoc.content);
    updateDocument(activeDoc.id, { content: sorted });
    showNotification('Lines sorted alphabetically', 'success');
    closeMenu();
  };

  const handleRemoveDuplicates = () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }
    const deduplicated = removeDuplicateLines(activeDoc.content);
    updateDocument(activeDoc.id, { content: deduplicated });
    showNotification('Duplicate lines removed', 'success');
    closeMenu();
  };

  const handleConvertCase = (type: 'upper' | 'lower' | 'title') => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }
    let converted = activeDoc.content;
    if (type === 'upper') {
      converted = convertToUpperCase(activeDoc.content);
    } else if (type === 'lower') {
      converted = convertToLowerCase(activeDoc.content);
    } else if (type === 'title') {
      converted = convertToTitleCase(activeDoc.content);
    }
    updateDocument(activeDoc.id, { content: converted });
    showNotification(`Converted to ${type} case`, 'success');
    closeMenu();
  };

  const handleTrimWhitespace = () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }
    const trimmed = trimWhitespace(activeDoc.content);
    updateDocument(activeDoc.id, { content: trimmed });
    showNotification('Whitespace trimmed', 'success');
    closeMenu();
  };

  const handleRemoveEmptyLines = () => {
    if (!activeDoc) {
      showNotification('No active document', 'warning');
      return;
    }
    const cleaned = removeEmptyLines(activeDoc.content);
    updateDocument(activeDoc.id, { content: cleaned });
    showNotification('Empty lines removed', 'success');
    closeMenu();
  };

  const isEncryptedDoc = activeDoc?.encrypted || false;

  return (
    <>
      <div className="header-dropdown-menus" ref={menuRef}>
        {/* File Menu */}
        <div className="dropdown-menu-container">
          <button
            ref={fileButtonRef}
            type="button"
            className={`dropdown-menu-button ${openMenu === 'file' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMenu('file', fileButtonRef);
            }}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div
              className="dropdown-menu-content"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button className="dropdown-menu-item" onClick={handleNewDocument}>
                <span>New Document</span>
                <span className="dropdown-menu-shortcut">Ctrl+N</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleOpenLocal}>
                <span>Open Local File</span>
                <span className="dropdown-menu-shortcut">Ctrl+O</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleOpenExternal}>
                <span>Open from Device</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+D</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleOpenDrive}>
                <span>Open from Google Drive</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+O</span>
              </button>

              <div className="dropdown-menu-separator" />

              <button className="dropdown-menu-item" onClick={handleSave}>
                <span>Save</span>
                <span className="dropdown-menu-shortcut">Ctrl+S</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleSaveAs}>
                <span>Save As</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+S</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleSaveAsToDevice}>
                <span>Save As to Device</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+E</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleSaveAll}>
                <span>Save All</span>
                <span className="dropdown-menu-shortcut">Ctrl+Alt+S</span>
              </button>

              <div className="dropdown-menu-separator" />

              <button className="dropdown-menu-item" onClick={handleExportText}>
                <span>Export as Text (.txt)</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleExportHTML}>
                <span>Export as HTML</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleShare}>
                <span>Share Document...</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+S</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleCopyToClipboard}>
                <span>Copy to Clipboard</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+C</span>
              </button>

              <div className="dropdown-menu-separator" />

              {!isEncryptedDoc ? (
                <button className="dropdown-menu-item" onClick={handleEncryptDocument}>
                  <span>🔒 Encrypt Document</span>
                  <span className="dropdown-menu-shortcut">Ctrl+E</span>
                </button>
              ) : (
                <>
                  <button className="dropdown-menu-item" onClick={handleChangePassword}>
                    <span>🔑 Change Password</span>
                  </button>

                  <button className="dropdown-menu-item" onClick={handleRemoveEncryption}>
                    <span>🔓 Remove Encryption</span>
                  </button>
                </>
              )}

              <button className="dropdown-menu-item" onClick={handleDecryptFile}>
                <span>🔓 Decrypt File</span>
                <span className="dropdown-menu-shortcut">Ctrl+D</span>
              </button>

              <div className="dropdown-menu-separator" />

              <button className="dropdown-menu-item" onClick={handleCloseTab}>
                <span>Close Tab</span>
                <span className="dropdown-menu-shortcut">Ctrl+W</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleCloseAll}>
                <span>Close All Tabs</span>
              </button>

              <div className="dropdown-menu-separator" />

              {driveAuthenticated ? (
                <button className="dropdown-menu-item" onClick={handleDisconnectDrive}>
                  <span>✓ Connected to Google Drive</span>
                </button>
              ) : (
                <button className="dropdown-menu-item" onClick={handleConnectDrive}>
                  <span>Connect to Google Drive</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="dropdown-menu-container">
          <button
            ref={editButtonRef}
            type="button"
            className={`dropdown-menu-button ${openMenu === 'edit' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMenu('edit', editButtonRef);
            }}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div
              className="dropdown-menu-content"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.undo, 'Undo')}>
                <span>Undo</span>
                <span className="dropdown-menu-shortcut">Ctrl+Z</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.redo, 'Redo')}>
                <span>Redo</span>
                <span className="dropdown-menu-shortcut">Ctrl+Y</span>
              </button>
              <div className="dropdown-menu-separator" />
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.cut, 'Cut')}>
                <span>Cut</span>
                <span className="dropdown-menu-shortcut">Ctrl+X</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.copy, 'Copy')}>
                <span>Copy</span>
                <span className="dropdown-menu-shortcut">Ctrl+C</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.paste, 'Paste')}>
                <span>Paste</span>
                <span className="dropdown-menu-shortcut">Ctrl+V</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.selectAll, 'Select All')}>
                <span>Select All</span>
                <span className="dropdown-menu-shortcut">Ctrl+A</span>
              </button>
              <div className="dropdown-menu-separator" />
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.find, 'Find')}>
                <span>Find</span>
                <span className="dropdown-menu-shortcut">Ctrl+F</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => handleAction(editorActions.findAndReplace, 'Find and Replace')}>
                <span>Find and Replace</span>
                <span className="dropdown-menu-shortcut">Ctrl+H</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => { showSearchAllTabs(); closeMenu(); }}>
                <span>Find in All Tabs</span>
                <span className="dropdown-menu-shortcut">Ctrl+Shift+F</span>
              </button>
              <div className="dropdown-menu-separator" />

              {/* Insert submenu */}
              <div
                ref={insertSubmenuRef}
                className="dropdown-menu-item dropdown-menu-item-submenu"
                onMouseEnter={() => handleSubmenuMouseEnter('insert', insertSubmenuRef)}
                onMouseLeave={() => handleSubmenuMouseLeave('insert')}
              >
                <span>Insert</span>
                <span className="dropdown-menu-arrow">▶</span>
                {showInsertSubmenu && (
                  <div
                    className="dropdown-submenu-content"
                    style={{ top: submenuPosition.top, left: submenuPosition.left }}
                    onMouseEnter={() => {
                      if (submenuTimeoutRef.current) {
                        clearTimeout(submenuTimeoutRef.current);
                        submenuTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={() => handleSubmenuMouseLeave('insert')}
                  >
                    <div className="dropdown-submenu-header">Date and Time</div>
                    <button className="dropdown-menu-item" onClick={() => handleInsertDate('short')}>
                      <span>Date (MM/DD/YYYY)</span>
                    </button>
                    <button className="dropdown-menu-item" onClick={() => handleInsertDate('long')}>
                      <span>Date (Month DD, YYYY)</span>
                    </button>
                    <button className="dropdown-menu-item" onClick={() => handleInsertDate('iso')}>
                      <span>Date (YYYY-MM-DD)</span>
                    </button>
                    <button className="dropdown-menu-item" onClick={() => handleInsertDate('time')}>
                      <span>Time (HH:MM AM/PM)</span>
                    </button>
                    <button className="dropdown-menu-item" onClick={() => handleInsertDate('datetime')}>
                      <span>Date & Time</span>
                    </button>
                    <div className="dropdown-menu-separator" />
                    <button className="dropdown-menu-item" onClick={handleInsertSpecialChar}>
                      <span>Special Character...</span>
                      <span className="dropdown-menu-shortcut">F3</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div className="dropdown-menu-container">
          <button
            ref={toolsButtonRef}
            type="button"
            className={`dropdown-menu-button ${openMenu === 'tools' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMenu('tools', toolsButtonRef);
            }}
          >
            Tools
          </button>
          {openMenu === 'tools' && (
            <div
              className="dropdown-menu-content"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button className="dropdown-menu-item" onClick={handleShowStatistics}>
                <span>Statistics</span>
                <span className="dropdown-menu-shortcut">Ctrl+I</span>
              </button>

              <div className="dropdown-menu-separator" />

              <button className="dropdown-menu-item" onClick={handleSortLines}>
                <span>Sort Lines</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleRemoveDuplicates}>
                <span>Remove Duplicates</span>
              </button>

              <div className="dropdown-menu-separator" />

              {/* Convert Case submenu */}
              <div
                ref={convertCaseSubmenuRef}
                className="dropdown-menu-item dropdown-menu-item-submenu"
                onMouseEnter={() => handleSubmenuMouseEnter('convertCase', convertCaseSubmenuRef)}
                onMouseLeave={() => handleSubmenuMouseLeave('convertCase')}
              >
                <span>Convert Case</span>
                <span className="dropdown-menu-arrow">▶</span>
                {showConvertCaseSubmenu && (
                  <div
                    className="dropdown-submenu-content"
                    style={{ top: submenuPosition.top, left: submenuPosition.left }}
                    onMouseEnter={() => {
                      if (submenuTimeoutRef.current) {
                        clearTimeout(submenuTimeoutRef.current);
                        submenuTimeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={() => handleSubmenuMouseLeave('convertCase')}
                  >
                    <button className="dropdown-menu-item" onClick={() => handleConvertCase('upper')}>
                      <span>UPPERCASE</span>
                    </button>
                    <button className="dropdown-menu-item" onClick={() => handleConvertCase('lower')}>
                      <span>lowercase</span>
                    </button>
                    <button className="dropdown-menu-item" onClick={() => handleConvertCase('title')}>
                      <span>Title Case</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="dropdown-menu-separator" />

              <button className="dropdown-menu-item" onClick={handleTrimWhitespace}>
                <span>Trim Whitespace</span>
              </button>

              <button className="dropdown-menu-item" onClick={handleRemoveEmptyLines}>
                <span>Remove Empty Lines</span>
              </button>
            </div>
          )}
        </div>

        {/* More Menu */}
        <div className="dropdown-menu-container">
          <button
            ref={moreButtonRef}
            type="button"
            className={`dropdown-menu-button ${openMenu === 'more' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMenu('more', moreButtonRef);
            }}
          >
            More
          </button>
          {openMenu === 'more' && (
            <div
              className="dropdown-menu-content"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button className="dropdown-menu-item" onClick={() => { toggleSpecialChars(); closeMenu(); }}>
                <span>{specialCharsVisible ? 'Hide' : 'Show'} Special Chars Bar</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => { toggleStatusBar(); closeMenu(); }}>
                <span>Toggle Status Bar</span>
              </button>
              <div className="dropdown-menu-separator" />
              <button className="dropdown-menu-item" onClick={() => { openDialog('settingsDialog'); closeMenu(); }}>
                <span>Settings</span>
              </button>
              <button className="dropdown-menu-item" onClick={() => { openDialog('helpDialog'); closeMenu(); }}>
                <span>Help</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Picker Dialog */}
      {showFilePicker && (
        <FilePickerDialog
          onSelect={handleFileSelect}
          onCancel={() => setShowFilePicker(false)}
        />
      )}

      {/* Drive File Picker Dialog */}
      {showDrivePicker && (
        <DriveFilePickerDialog
          onSelect={handleDriveFileSelect}
          onCancel={() => setShowDrivePicker(false)}
        />
      )}

      {/* Password Dialog for decryption or save */}
      {showPasswordDialog && (
        <PasswordDialog
          mode={
            pendingEncryptedData || pendingExternalFile || pendingDriveFile
              ? 'decrypt'
              : saveAsToDeviceMode || saveAsMode
              ? 'encrypt'
              : dialogMode === 'encrypt' || dialogMode === 'decrypt'
              ? dialogMode
              : 'encrypt'
          }
          onConfirm={
            saveAsToDeviceMode || saveAsMode
              ? handleSavePassword
              : pendingExternalFile
              ? handleExternalDecryptPassword
              : pendingDriveFile
              ? handleDriveDecryptPassword
              : pendingEncryptedData
              ? handleDecryptPassword
              : dialogMode === 'encrypt' || dialogMode === 'decrypt'
              ? handleSecurityPasswordConfirm
              : handleSavePassword
          }
          onCancel={() => {
            setShowPasswordDialog(false);
            setPendingEncryptedData(null);
            setPendingDriveFile(null);
            setPendingExternalFile(null);
            setSaveAsMode(false);
            setSaveAsToDeviceMode(false);
            setDialogMode('encrypt');
          }}
          filename={
            pendingExternalFile?.filename ||
            pendingDriveFile?.filename ||
            pendingEncryptedData?.data.metadata.filename ||
            activeDoc?.metadata.filename
          }
        />
      )}

      {/* Filename Dialog for Save As */}
      {showFilenameDialog && (
        <FilenameDialog
          suggestedFilename={suggestedFilename}
          onConfirm={handleFilenameConfirm}
          onCancel={() => {
            setShowFilenameDialog(false);
            setPasswordForSaveAs(undefined);
            setSaveAsMode(false);
          }}
        />
      )}
    </>
  );
};
