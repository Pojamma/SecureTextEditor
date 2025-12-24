import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDocumentStore } from '@/stores/documentStore';
import { OpenDocument } from '@/types/document.types';
import { saveFile } from '@/services/filesystem.service';

export interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

interface UseAutoSaveOptions {
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}

/**
 * Auto-save hook that automatically saves modified documents at configured intervals
 *
 * Features:
 * - Only auto-saves documents that have been saved at least once (have a path)
 * - Respects the auto-save enabled/disabled setting
 * - Uses configurable interval (1, 2, 5, 10 minutes)
 * - Resets timer when document is manually saved or switched
 * - Provides status for UI indicators
 * - Handles errors gracefully
 */
export const useAutoSave = (options?: UseAutoSaveOptions) => {
  const { autoSave, autoSaveInterval } = useSettingsStore();
  const { getActiveDocument, updateDocument, activeDocumentId } = useDocumentStore();
  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDocIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>('');

  // Get active document for dependency tracking
  const activeDoc = getActiveDocument();
  const activeDocModified = activeDoc?.modified;
  const activeDocPath = activeDoc?.path;
  const activeDocSource = activeDoc?.source;

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Don't set up timer if auto-save is disabled
    if (!autoSave) {
      return;
    }

    // Don't auto-save if:
    // - No active document
    // - Document hasn't been saved yet (no path)
    // - Document hasn't been modified
    // - Document is a temp document
    if (!activeDoc || !activeDocPath || !activeDocModified || activeDocSource === 'temp') {
      return;
    }

    // If document changed, reset lastContent
    if (activeDocumentId !== lastDocIdRef.current) {
      lastDocIdRef.current = activeDocumentId;
      lastContentRef.current = activeDoc.content;
    }

    // If content hasn't changed since last check, don't need to save
    if (activeDoc.content === lastContentRef.current && !activeDocModified) {
      return;
    }

    // Set up auto-save timer
    const intervalMs = autoSaveInterval * 60 * 1000; // Convert minutes to milliseconds

    console.log(`[Auto-save] Timer set for ${autoSaveInterval} minutes for "${activeDoc.metadata.filename}"`);

    timerRef.current = setTimeout(async () => {
      // Get CURRENT document state (not stale closure)
      const currentDoc = getActiveDocument();
      if (currentDoc) {
        console.log(`[Auto-save] Timer expired, saving "${currentDoc.metadata.filename}"`);
        await performAutoSave(currentDoc);
      }
    }, intervalMs);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoSave, autoSaveInterval, activeDocumentId, activeDocModified, activeDocPath, activeDocSource]);

  const performAutoSave = async (document: OpenDocument) => {
    console.log(`[Auto-save] performAutoSave called for "${document.metadata.filename}"`, {
      hasPath: !!document.path,
      isModified: document.modified,
      isEncrypted: document.encrypted,
      source: document.source
    });

    // Double-check document still exists and needs saving
    if (!document || !document.path || !document.modified) {
      console.log('[Auto-save] Skipping: document missing, no path, or not modified');
      return;
    }

    setStatus({ isSaving: true, lastSaved: null, error: null });

    try {
      // Save the file
      // For encrypted documents, we can't auto-save because we don't have the password
      // Only auto-save plain documents
      if (document.encrypted) {
        console.log('[Auto-save] Skipping: encrypted document');
        setStatus({
          isSaving: false,
          lastSaved: null,
          error: 'Cannot auto-save encrypted documents',
        });
        options?.onError?.('Cannot auto-save encrypted documents');
        return;
      }

      console.log(`[Auto-save] Saving file: ${document.path}`);
      await saveFile(document);

      // Update document modified flag
      if (activeDocumentId && activeDocumentId === document.id) {
        updateDocument(activeDocumentId, { modified: false });
        lastContentRef.current = document.content;
      }

      const now = new Date();
      setStatus({
        isSaving: false,
        lastSaved: now,
        error: null,
      });

      console.log(`[Auto-save] Successfully saved "${document.metadata.filename}"`);
      options?.onSuccess?.(document.metadata.filename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
      setStatus({
        isSaving: false,
        lastSaved: null,
        error: errorMessage,
      });

      options?.onError?.(errorMessage);
      console.error('[Auto-save] Save failed:', error);
    }
  };

  /**
   * Manually trigger auto-save (useful for testing or force-save scenarios)
   */
  const triggerAutoSave = async () => {
    const activeDoc = getActiveDocument();
    if (activeDoc) {
      await performAutoSave(activeDoc);
    }
  };

  /**
   * Reset the auto-save timer (useful when document is manually saved)
   */
  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const activeDoc = getActiveDocument();
    if (activeDoc) {
      lastContentRef.current = activeDoc.content;
    }
  };

  return {
    status,
    triggerAutoSave,
    resetTimer,
  };
};
