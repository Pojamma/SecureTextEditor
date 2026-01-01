/**
 * Recent Files Service
 * Manages persistent history of recently opened files
 * Separate from session documents - tracks files even after tabs are closed
 */

export interface RecentFileEntry {
  filename: string;
  path: string;
  source: 'local' | 'drive' | 'external' | 'temp';
  externalUri?: string;
  lastOpened: string; // ISO timestamp
}

const RECENT_FILES_KEY = 'securetexteditor_recent_files';
const DEFAULT_MAX_RECENT = 10;

export class RecentFilesService {
  /**
   * Add a file to the recent files list
   * Automatically moves to top if already exists
   */
  static addRecentFile(file: Omit<RecentFileEntry, 'lastOpened'>): void {
    try {
      const recentFiles = this.getRecentFiles();

      // Remove existing entry if present (to avoid duplicates)
      const filtered = recentFiles.filter(rf => {
        if (file.source === 'external' && rf.source === 'external') {
          return rf.externalUri !== file.externalUri;
        }
        return rf.path !== file.path;
      });

      // Add new entry at the beginning (most recent)
      const newEntry: RecentFileEntry = {
        ...file,
        lastOpened: new Date().toISOString(),
      };

      const updated = [newEntry, ...filtered];

      // Get max recent files from settings (default 10)
      const maxRecent = this.getMaxRecentFiles();
      const trimmed = updated.slice(0, maxRecent);

      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
      console.log('Added to recent files:', newEntry.filename);
    } catch (error) {
      console.error('Failed to add recent file:', error);
    }
  }

  /**
   * Get all recent files
   */
  static getRecentFiles(): RecentFileEntry[] {
    try {
      const data = localStorage.getItem(RECENT_FILES_KEY);
      if (!data) return [];

      const files: RecentFileEntry[] = JSON.parse(data);

      // Validate structure
      if (!Array.isArray(files)) {
        console.warn('Invalid recent files data structure');
        this.clearRecentFiles();
        return [];
      }

      // Get max recent files from settings and trim if needed
      const maxRecent = this.getMaxRecentFiles();
      if (files.length > maxRecent) {
        const trimmed = files.slice(0, maxRecent);
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
        return trimmed;
      }

      return files;
    } catch (error) {
      console.error('Failed to load recent files:', error);
      return [];
    }
  }

  /**
   * Clear all recent files
   */
  static clearRecentFiles(): void {
    try {
      localStorage.removeItem(RECENT_FILES_KEY);
      console.log('Recent files cleared');
    } catch (error) {
      console.error('Failed to clear recent files:', error);
    }
  }

  /**
   * Remove a specific file from recent files
   */
  static removeRecentFile(path: string, externalUri?: string): void {
    try {
      const recentFiles = this.getRecentFiles();
      const filtered = recentFiles.filter(rf => {
        if (externalUri) {
          return rf.externalUri !== externalUri;
        }
        return rf.path !== path;
      });

      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered));
      console.log('Removed from recent files:', path);
    } catch (error) {
      console.error('Failed to remove recent file:', error);
    }
  }

  /**
   * Get max recent files setting from localStorage
   * Falls back to default if not set
   */
  private static getMaxRecentFiles(): number {
    try {
      // Get from settings store (zustand persists to localStorage)
      const settingsData = localStorage.getItem('securetexteditor-settings');
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        if (settings.state?.maxRecentFiles) {
          return settings.state.maxRecentFiles;
        }
      }
    } catch (error) {
      console.error('Failed to get maxRecentFiles setting:', error);
    }
    return DEFAULT_MAX_RECENT;
  }

  /**
   * Update recent files list when max setting changes
   * Trims the list if needed
   */
  static applyMaxRecentFiles(maxRecent: number): void {
    try {
      const recentFiles = this.getRecentFiles();
      if (recentFiles.length > maxRecent) {
        const trimmed = recentFiles.slice(0, maxRecent);
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
        console.log(`Trimmed recent files to ${maxRecent}`);
      }
    } catch (error) {
      console.error('Failed to apply max recent files:', error);
    }
  }
}
