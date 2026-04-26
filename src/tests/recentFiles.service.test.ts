import { describe, it, expect, beforeEach } from 'vitest';
import { RecentFilesService } from '@/services/recentFiles.service';

const RECENT_KEY = 'securetexteditor_recent_files';

const makeFile = (name: string, path = `/docs/${name}`) => ({
  filename: name,
  path,
  source: 'local' as const,
});

describe('RecentFilesService.addRecentFile', () => {
  beforeEach(() => localStorage.clear());

  it('adds a file to the list', () => {
    RecentFilesService.addRecentFile(makeFile('a.txt'));
    expect(RecentFilesService.getRecentFiles()).toHaveLength(1);
  });

  it('moves existing file to the front instead of duplicating', () => {
    RecentFilesService.addRecentFile(makeFile('a.txt'));
    RecentFilesService.addRecentFile(makeFile('b.txt'));
    RecentFilesService.addRecentFile(makeFile('a.txt'));
    const files = RecentFilesService.getRecentFiles();
    expect(files).toHaveLength(2);
    expect(files[0].filename).toBe('a.txt');
  });

  it('adds timestamp', () => {
    RecentFilesService.addRecentFile(makeFile('ts.txt'));
    const files = RecentFilesService.getRecentFiles();
    expect(files[0].lastOpened).toBeTruthy();
  });

  it('most recently opened file is first', () => {
    RecentFilesService.addRecentFile(makeFile('first.txt'));
    RecentFilesService.addRecentFile(makeFile('second.txt'));
    expect(RecentFilesService.getRecentFiles()[0].filename).toBe('second.txt');
  });
});

describe('RecentFilesService.getRecentFiles', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty array when nothing saved', () => {
    expect(RecentFilesService.getRecentFiles()).toEqual([]);
  });

  it('returns empty array and clears invalid data', () => {
    localStorage.setItem(RECENT_KEY, 'not json');
    expect(RecentFilesService.getRecentFiles()).toEqual([]);
  });

  it('clears and returns empty array for non-array data', () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify({ wrong: 'format' }));
    expect(RecentFilesService.getRecentFiles()).toEqual([]);
  });
});

describe('RecentFilesService.clearRecentFiles', () => {
  beforeEach(() => localStorage.clear());

  it('removes all recent files', () => {
    RecentFilesService.addRecentFile(makeFile('a.txt'));
    RecentFilesService.clearRecentFiles();
    expect(RecentFilesService.getRecentFiles()).toHaveLength(0);
  });

  it('does not throw when nothing to clear', () => {
    expect(() => RecentFilesService.clearRecentFiles()).not.toThrow();
  });
});

describe('RecentFilesService.removeRecentFile', () => {
  beforeEach(() => localStorage.clear());

  it('removes a specific file by path', () => {
    RecentFilesService.addRecentFile(makeFile('a.txt', '/docs/a.txt'));
    RecentFilesService.addRecentFile(makeFile('b.txt', '/docs/b.txt'));
    RecentFilesService.removeRecentFile('/docs/a.txt');
    const files = RecentFilesService.getRecentFiles();
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('b.txt');
  });

  it('removes by externalUri when provided', () => {
    const externalFile = {
      filename: 'external.txt',
      path: '',
      source: 'external' as const,
      externalUri: 'content://provider/external.txt',
    };
    RecentFilesService.addRecentFile(externalFile);
    RecentFilesService.removeRecentFile('', 'content://provider/external.txt');
    expect(RecentFilesService.getRecentFiles()).toHaveLength(0);
  });

  it('does not remove unrelated files', () => {
    RecentFilesService.addRecentFile(makeFile('keep.txt', '/docs/keep.txt'));
    RecentFilesService.removeRecentFile('/docs/other.txt');
    expect(RecentFilesService.getRecentFiles()).toHaveLength(1);
  });
});

describe('RecentFilesService.applyMaxRecentFiles', () => {
  beforeEach(() => localStorage.clear());

  it('trims list to max when it exceeds the limit', () => {
    for (let i = 0; i < 5; i++) {
      RecentFilesService.addRecentFile(makeFile(`file${i}.txt`, `/docs/file${i}.txt`));
    }
    RecentFilesService.applyMaxRecentFiles(3);
    expect(RecentFilesService.getRecentFiles()).toHaveLength(3);
  });

  it('does not change list when within limit', () => {
    RecentFilesService.addRecentFile(makeFile('a.txt'));
    RecentFilesService.applyMaxRecentFiles(10);
    expect(RecentFilesService.getRecentFiles()).toHaveLength(1);
  });
});
