import { OpenDocument } from '@/types/document.types';

export interface SessionData {
  version: string;
  timestamp: string;
  documents: OpenDocument[];
  activeDocumentId: string | null;
  uiState: {
    theme: string;
    fontSize: number;
    statusBar: boolean;
  };
}

const SESSION_STORAGE_KEY = 'securetexteditor_session';
// Increment this version when making changes that break session compatibility
// This will automatically clear old session data on app update
const SESSION_VERSION = '1.1.0'; // Updated for menu reorganization and context menu features

/**
 * Session Service for persisting and restoring application state
 */
export class SessionService {
  /**
   * Save current session to localStorage
   * IMPORTANT: Clears decrypted content from encrypted documents for security
   */
  static saveSession(sessionData: Omit<SessionData, 'version' | 'timestamp'>): void {
    try {
      // Security: Clear decrypted content from encrypted documents before saving
      const secureDocs = sessionData.documents.map((doc) => {
        if (doc.encrypted) {
          // Don't save decrypted content for encrypted files
          return {
            ...doc,
            content: '', // Clear content - will require password to restore
          };
        }
        return doc;
      });

      const dataToSave: SessionData = {
        version: SESSION_VERSION,
        timestamp: new Date().toISOString(),
        ...sessionData,
        documents: secureDocs,
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Session saved successfully', dataToSave);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load session from localStorage
   */
  static loadSession(): SessionData | null {
    try {
      const savedData = localStorage.getItem(SESSION_STORAGE_KEY);

      if (!savedData) {
        console.log('No saved session found');
        return null;
      }

      const session: SessionData = JSON.parse(savedData);

      // Validate session structure
      if (!session.version || !session.documents || !Array.isArray(session.documents)) {
        console.warn('Invalid session data structure');
        this.clearSession();
        return null;
      }

      // Check for version mismatch - clear session if app has been updated
      if (session.version !== SESSION_VERSION) {
        console.warn(`Session version mismatch (saved: ${session.version}, current: ${SESSION_VERSION}). Clearing old session data.`);
        this.clearSession();
        return null;
      }

      console.log('Session loaded successfully', session);
      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      // Clear corrupted session data
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear saved session
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('Session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Check if a saved session exists
   */
  static hasSession(): boolean {
    return localStorage.getItem(SESSION_STORAGE_KEY) !== null;
  }

  /**
   * Get session age in milliseconds
   */
  static getSessionAge(): number | null {
    const session = this.loadSession();
    if (!session || !session.timestamp) {
      return null;
    }

    const savedTime = new Date(session.timestamp).getTime();
    const currentTime = new Date().getTime();
    return currentTime - savedTime;
  }

  /**
   * Check if session is expired (older than specified hours)
   */
  static isSessionExpired(maxAgeHours: number = 24 * 7): boolean {
    const age = this.getSessionAge();
    if (age === null) return true;

    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    return age > maxAgeMs;
  }
}
