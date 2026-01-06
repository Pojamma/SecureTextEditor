import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';

// Mock all dependencies BEFORE importing the service
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    deleteFile: vi.fn(),
  },
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
  },
  Encoding: {
    UTF8: 'utf8',
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
  },
}));

vi.mock('capacitor-file-writer', () => ({
  FileWriter: {
    writeToUri: vi.fn(),
  },
}));

vi.mock('@/services/encryption.service', () => ({
  encryptDocument: vi.fn(),
  decryptDocument: vi.fn(),
  isEncrypted: vi.fn(),
  encryptToBinary: vi.fn(),
  decryptFromBinary: vi.fn(),
  isBinaryEncrypted: vi.fn(),
}));

vi.mock('@/services/externalFilesystem.service', () => ({
  pickExternalFile: vi.fn(),
  checkExternalFileAccess: vi.fn(),
  saveToExternalUri: vi.fn(),
  saveAsToExternalDevice: vi.fn(),
}));

vi.mock('@/services/recentFiles.service', () => ({
  RecentFilesService: {
    addRecentFile: vi.fn(),
  },
}));

vi.mock('@/utils/helpers', () => ({
  generateId: vi.fn(() => 'test-id-123'),
  formatDate: vi.fn(() => '2026-01-04T12:00:00.000Z'),
}));

// Now import the service and types
import {
  readFile,
  saveFile,
  saveFileAs,
  fileExists,
  listFiles,
  deleteFile,
  renameFile,
  copyFile,
  getFileExtension,
} from '@/services/filesystem.service';
import type { OpenDocument, PlainDocument } from '@/types/document.types';
import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import * as encryptionService from '@/services/encryption.service';

describe('Filesystem Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (Filesystem.checkPermissions as Mock).mockResolvedValue({ publicStorage: 'granted' });
    (Filesystem.requestPermissions as Mock).mockResolvedValue({ publicStorage: 'granted' });
    (Capacitor.getPlatform as Mock).mockReturnValue('web');
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.txt')).toBe('txt');
      expect(getFileExtension('notes.md')).toBe('md');
      expect(getFileExtension('file.enc')).toBe('enc');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Makefile')).toBe('');
    });

    it('should handle empty filename', () => {
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      (Filesystem.stat as Mock).mockResolvedValue({ uri: 'file://test.txt' });

      const exists = await fileExists('test.txt');
      expect(exists).toBe(true);
      expect(Filesystem.stat).toHaveBeenCalledWith({
        path: 'test.txt',
        directory: 'DOCUMENTS',
      });
    });

    it('should return false if file does not exist', async () => {
      (Filesystem.stat as Mock).mockRejectedValue(new Error('File not found'));

      const exists = await fileExists('nonexistent.txt');
      expect(exists).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      (Filesystem.readdir as Mock).mockResolvedValue({
        files: [
          { name: 'file1.txt', type: 'file' },
          { name: 'file2.txt', type: 'file' },
          { name: '.hidden', type: 'file' },
        ],
      });

      const files = await listFiles();

      expect(files).toEqual(['file1.txt', 'file2.txt']);
      expect(files).not.toContain('.hidden');
      expect(Filesystem.readdir).toHaveBeenCalledWith({
        path: '',
        directory: 'DOCUMENTS',
      });
    });

    it('should return empty array on error', async () => {
      (Filesystem.readdir as Mock).mockRejectedValue(new Error('Read error'));

      const files = await listFiles();
      expect(files).toEqual([]);
    });

    it('should filter out hidden files', async () => {
      (Filesystem.readdir as Mock).mockResolvedValue({
        files: [
          { name: 'visible.txt', type: 'file' },
          { name: '.gitignore', type: 'file' },
          { name: '.DS_Store', type: 'file' },
        ],
      });

      const files = await listFiles();
      expect(files).toEqual(['visible.txt']);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      (Filesystem.deleteFile as Mock).mockResolvedValue(undefined);

      await deleteFile('test.txt');

      expect(Filesystem.deleteFile).toHaveBeenCalledWith({
        path: 'test.txt',
        directory: 'DOCUMENTS',
      });
    });

    it('should throw error on delete failure', async () => {
      (Filesystem.deleteFile as Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(deleteFile('test.txt')).rejects.toThrow('Failed to delete file');
    });
  });

  describe('readFile - plain text', () => {
    it('should read plain text file', async () => {
      const fileContent = 'Hello, world!';
      (Filesystem.readFile as Mock).mockResolvedValue({ data: fileContent });
      (encryptionService.isEncrypted as Mock).mockReturnValue(false);

      const result = await readFile('test.txt');

      expect(result.requiresPassword).toBe(false);
      expect(result.document.content).toBe(fileContent);
      expect(result.document.encrypted).toBe(false);
      expect(result.document.source).toBe('local');
      expect(result.document.metadata.filename).toBe('test.txt');
    });

    it('should read plain text with special characters', async () => {
      const content = 'Hello 🔐 测试 العربية';
      (Filesystem.readFile as Mock).mockResolvedValue({ data: content });
      (encryptionService.isEncrypted as Mock).mockReturnValue(false);

      const result = await readFile('unicode.txt');

      expect(result.document.content).toBe(content);
    });
  });

  describe('readFile - JSON format', () => {
    it('should read plain document in JSON format', async () => {
      const plainDoc: PlainDocument = {
        content: 'Document content',
        metadata: {
          filename: 'doc.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
        },
      };

      (Filesystem.readFile as Mock).mockResolvedValue({
        data: JSON.stringify(plainDoc),
      });
      (encryptionService.isEncrypted as Mock).mockReturnValue(false);

      const result = await readFile('doc.txt');

      expect(result.requiresPassword).toBe(false);
      expect(result.document.content).toBe('Document content');
      expect(result.document.metadata.filename).toBe('doc.txt');
    });

    it('should detect encrypted JSON document', async () => {
      const encryptedDoc = {
        version: 1,
        encrypted: true,
        ciphertext: 'encrypted-data',
        salt: 'salt-data',
        iv: 'iv-data',
        metadata: {
          filename: 'secret.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          encrypted: true,
        },
      };

      (Filesystem.readFile as Mock).mockResolvedValue({
        data: JSON.stringify(encryptedDoc),
      });
      (encryptionService.isEncrypted as Mock).mockReturnValue(true);

      const result = await readFile('secret.txt');

      expect(result.requiresPassword).toBe(true);
      expect(result.document.encrypted).toBe(true);
      expect(result.encryptedData).toEqual(encryptedDoc);
    });
  });

  describe('saveFile - plain text', () => {
    it('should save plain document', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'test.txt',
        source: 'local',
        encrypted: false,
        content: 'Test content',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'test.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
        },
      };

      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);

      await saveFile(document);

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: 'test.txt',
        data: expect.stringContaining('Test content'),
        directory: 'DOCUMENTS',
        encoding: 'utf8',
        recursive: true,
      });
    });
  });

  describe('saveFile - encrypted', () => {
    it('should save encrypted document with password', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'secret.txt',
        source: 'local',
        encrypted: true,
        content: 'Secret content',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'secret.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          encrypted: true,
        },
      };

      const encryptedDoc = {
        version: 1,
        encrypted: true,
        ciphertext: 'encrypted-data',
        salt: 'salt',
        iv: 'iv',
        metadata: document.metadata,
      };

      (encryptionService.encryptDocument as Mock).mockResolvedValue(encryptedDoc);
      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);

      await saveFile(document, 'password123');

      expect(encryptionService.encryptDocument).toHaveBeenCalled();
      expect(Filesystem.writeFile).toHaveBeenCalled();
    });

    it('should throw error if encrypted document saved without password', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'secret.txt',
        source: 'local',
        encrypted: true,
        content: 'Secret',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'secret.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          encrypted: true,
        },
      };

      await expect(saveFile(document)).rejects.toThrow('Password required');
    });
  });

  describe('saveFileAs', () => {
    it('should save document with new filename', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'old.txt',
        source: 'local',
        encrypted: false,
        content: 'Content',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'old.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
        },
      };

      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);

      const newPath = await saveFileAs(document, 'new.txt');

      expect(newPath).toBe('new.txt');
      expect(Filesystem.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'new.txt',
        })
      );
    });

    it('should save encrypted document with new filename', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'old.txt',
        source: 'local',
        encrypted: true,
        content: 'Secret',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'old.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          encrypted: true,
        },
      };

      (encryptionService.encryptDocument as Mock).mockResolvedValue({
        version: 1,
        encrypted: true,
        ciphertext: 'encrypted',
        salt: 'salt',
        iv: 'iv',
        metadata: {},
      });
      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);

      const newPath = await saveFileAs(document, 'new-secret.txt', 'password');

      expect(newPath).toBe('new-secret.txt');
      expect(encryptionService.encryptDocument).toHaveBeenCalled();
    });
  });

  describe('renameFile', () => {
    it('should rename a file', async () => {
      (Filesystem.readFile as Mock).mockResolvedValue({ data: 'content' });
      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);
      (Filesystem.deleteFile as Mock).mockResolvedValue(undefined);
      (Filesystem.stat as Mock).mockRejectedValue(new Error('Not found'));

      await renameFile('old.txt', 'new.txt');

      expect(Filesystem.readFile).toHaveBeenCalledWith({
        path: 'old.txt',
        directory: 'DOCUMENTS',
        encoding: 'utf8',
      });

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: 'new.txt',
        data: 'content',
        directory: 'DOCUMENTS',
        encoding: 'utf8',
        recursive: true,
      });

      expect(Filesystem.deleteFile).toHaveBeenCalledWith({
        path: 'old.txt',
        directory: 'DOCUMENTS',
      });
    });

    it('should throw error if target filename exists', async () => {
      (Filesystem.stat as Mock).mockResolvedValue({ uri: 'exists' });

      await expect(renameFile('old.txt', 'existing.txt')).rejects.toThrow(
        'already exists'
      );
    });

    it('should throw error if permission denied', async () => {
      (Capacitor.getPlatform as Mock).mockReturnValue('android'); // Permission check only on Android
      (Filesystem.checkPermissions as Mock).mockResolvedValue({
        publicStorage: 'denied',
      });
      (Filesystem.requestPermissions as Mock).mockResolvedValue({
        publicStorage: 'denied',
      });
      (Filesystem.stat as Mock).mockRejectedValue(new Error('Not found')); // Target doesn't exist

      await expect(renameFile('old.txt', 'new.txt')).rejects.toThrow(
        /permission denied/i
      );
    });
  });

  describe('copyFile', () => {
    it('should copy a file', async () => {
      (Filesystem.readFile as Mock).mockResolvedValue({ data: 'original content' });
      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);
      (Filesystem.stat as Mock).mockRejectedValue(new Error('Not found'));

      await copyFile('source.txt', 'copy.txt');

      expect(Filesystem.readFile).toHaveBeenCalledWith({
        path: 'source.txt',
        directory: 'DOCUMENTS',
        encoding: 'utf8',
      });

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: 'copy.txt',
        data: 'original content',
        directory: 'DOCUMENTS',
        encoding: 'utf8',
        recursive: true,
      });
    });

    it('should throw error if target exists', async () => {
      (Filesystem.stat as Mock).mockResolvedValue({ uri: 'exists' });

      await expect(copyFile('source.txt', 'existing.txt')).rejects.toThrow(
        'already exists'
      );
    });

    it('should preserve file content exactly', async () => {
      const content = 'Content with\nnewlines\tand\ttabs';
      (Filesystem.readFile as Mock).mockResolvedValue({ data: content });
      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);
      (Filesystem.stat as Mock).mockRejectedValue(new Error('Not found'));

      await copyFile('source.txt', 'copy.txt');

      expect(Filesystem.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          data: content,
        })
      );
    });
  });

  describe('permission handling', () => {
    it('should handle permission denial gracefully', async () => {
      (Capacitor.getPlatform as Mock).mockReturnValue('android'); // Permissions checked on Android
      (Filesystem.checkPermissions as Mock).mockResolvedValue({
        publicStorage: 'denied',
      });
      (Filesystem.requestPermissions as Mock).mockResolvedValue({
        publicStorage: 'denied',
      });

      await expect(readFile('test.txt')).rejects.toThrow(/permission denied/i);
    });

    it('should request permissions if not granted', async () => {
      (Capacitor.getPlatform as Mock).mockReturnValue('android'); // Permissions checked on Android
      (Filesystem.checkPermissions as Mock).mockResolvedValue({
        publicStorage: 'prompt',
      });
      (Filesystem.requestPermissions as Mock).mockResolvedValue({
        publicStorage: 'granted',
      });
      (Filesystem.readFile as Mock).mockResolvedValue({ data: 'content' });
      (encryptionService.isEncrypted as Mock).mockReturnValue(false);

      await readFile('test.txt');

      expect(Filesystem.requestPermissions).toHaveBeenCalled();
      expect(Filesystem.readFile).toHaveBeenCalled();
    });

    it('should skip permission check on web platform', async () => {
      (Capacitor.getPlatform as Mock).mockReturnValue('web');
      (Filesystem.checkPermissions as Mock).mockResolvedValue({
        publicStorage: 'granted',
      });
      (Filesystem.readFile as Mock).mockResolvedValue({ data: 'content' });
      (encryptionService.isEncrypted as Mock).mockReturnValue(false);

      const result = await readFile('test.txt');

      expect(result.requiresPassword).toBe(false);
      expect(Filesystem.readFile).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty file content', async () => {
      (Filesystem.readFile as Mock).mockResolvedValue({ data: '' });

      const result = await readFile('empty.txt');

      expect(result.document.content).toBe('');
      expect(result.requiresPassword).toBe(false);
    });

    it('should handle malformed JSON gracefully', async () => {
      (Filesystem.readFile as Mock).mockResolvedValue({
        data: '{invalid json',
      });

      const result = await readFile('bad.txt');

      expect(result.document.content).toBe('{invalid json');
      expect(result.requiresPassword).toBe(false);
    });

    it('should handle very long filenames', async () => {
      const longFilename = 'a'.repeat(255) + '.txt';
      const document: OpenDocument = {
        id: 'doc1',
        path: longFilename,
        source: 'local',
        encrypted: false,
        content: 'Content',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: longFilename,
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
        },
      };

      (Filesystem.writeFile as Mock).mockResolvedValue(undefined);

      await saveFile(document);

      expect(Filesystem.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: longFilename,
        })
      );
    });

    it('should handle special characters in filename', async () => {
      const filename = 'file with spaces & special (chars).txt';
      (Filesystem.readFile as Mock).mockResolvedValue({ data: 'content' });

      const result = await readFile(filename);

      expect(result.document.metadata.filename).toBe(filename);
    });
  });

  describe('error handling', () => {
    it('should throw descriptive error on read failure', async () => {
      (Filesystem.readFile as Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(readFile('test.txt')).rejects.toThrow('Failed to read file');
    });

    it('should throw descriptive error on write failure', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'test.txt',
        source: 'local',
        encrypted: false,
        content: 'Content',
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'test.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
        },
      };

      (Filesystem.writeFile as Mock).mockRejectedValue(
        new Error('Disk full')
      );

      await expect(saveFile(document)).rejects.toThrow('Failed to save file');
    });

    it('should handle filesystem quota exceeded', async () => {
      const document: OpenDocument = {
        id: 'doc1',
        path: 'large.txt',
        source: 'local',
        encrypted: false,
        content: 'x'.repeat(10 * 1024 * 1024), // 10MB
        modified: false,
        cursorPosition: 0,
        scrollPosition: 0,
        metadata: {
          filename: 'large.txt',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
        },
      };

      (Filesystem.writeFile as Mock).mockRejectedValue(
        new Error('QuotaExceededError')
      );

      await expect(saveFile(document)).rejects.toThrow('Failed to save file');
    });
  });
});
