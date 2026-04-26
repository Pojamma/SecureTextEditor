import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionService } from '@/services/session.service';
import type { OpenDocument } from '@/types/document.types';

const SESSION_KEY = 'securetexteditor_session';

const makePlainDoc = (id: string, content = 'hello'): OpenDocument => ({
  id,
  path: `doc-${id}.txt`,
  source: 'local',
  encrypted: false,
  content,
  modified: false,
  cursorPosition: 0,
  scrollPosition: 0,
  metadata: {
    filename: `doc-${id}.txt`,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
  },
});

const makeEncryptedDoc = (id: string): OpenDocument => ({
  ...makePlainDoc(id, 'secret content'),
  encrypted: true,
});

describe('SessionService.saveSession', () => {
  beforeEach(() => localStorage.clear());

  it('saves session data to localStorage', () => {
    const doc = makePlainDoc('1');
    SessionService.saveSession({ documents: [doc], activeDocumentId: '1', uiState: { theme: 'dark', fontSize: 14, statusBar: true } });
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it('includes version and timestamp in saved data', () => {
    SessionService.saveSession({ documents: [], activeDocumentId: null, uiState: { theme: 'light', fontSize: 12, statusBar: true } });
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY)!);
    expect(saved.version).toBeTruthy();
    expect(saved.timestamp).toBeTruthy();
  });

  it('clears content of encrypted documents before saving', () => {
    const doc = makeEncryptedDoc('1');
    SessionService.saveSession({ documents: [doc], activeDocumentId: '1', uiState: { theme: 'dark', fontSize: 14, statusBar: true } });
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY)!);
    expect(saved.documents[0].content).toBe('');
  });

  it('preserves content of plain documents', () => {
    const doc = makePlainDoc('1', 'my notes');
    SessionService.saveSession({ documents: [doc], activeDocumentId: '1', uiState: { theme: 'dark', fontSize: 14, statusBar: true } });
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY)!);
    expect(saved.documents[0].content).toBe('my notes');
  });
});

describe('SessionService.loadSession', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when no session exists', () => {
    expect(SessionService.loadSession()).toBeNull();
  });

  it('returns null and clears corrupted data', () => {
    localStorage.setItem(SESSION_KEY, 'not valid json{{{');
    expect(SessionService.loadSession()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('returns null and clears session with invalid structure', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ wrong: 'shape' }));
    expect(SessionService.loadSession()).toBeNull();
  });

  it('returns null and clears outdated session version', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ version: '0.0.1', documents: [], activeDocumentId: null, uiState: {} }));
    expect(SessionService.loadSession()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('round-trips a valid session', () => {
    const doc = makePlainDoc('42', 'round trip content');
    SessionService.saveSession({ documents: [doc], activeDocumentId: '42', uiState: { theme: 'nord', fontSize: 16, statusBar: false } });
    const loaded = SessionService.loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded!.activeDocumentId).toBe('42');
    expect(loaded!.documents[0].content).toBe('round trip content');
  });
});

describe('SessionService.clearSession', () => {
  it('removes session from localStorage', () => {
    localStorage.setItem(SESSION_KEY, '{"some":"data"}');
    SessionService.clearSession();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('does not throw when nothing to clear', () => {
    expect(() => SessionService.clearSession()).not.toThrow();
  });
});

describe('SessionService.hasSession', () => {
  beforeEach(() => localStorage.clear());

  it('returns false when no session', () => {
    expect(SessionService.hasSession()).toBe(false);
  });

  it('returns true after saving', () => {
    SessionService.saveSession({ documents: [], activeDocumentId: null, uiState: { theme: 'light', fontSize: 14, statusBar: true } });
    expect(SessionService.hasSession()).toBe(true);
  });
});

describe('SessionService.getSessionAge', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when no session', () => {
    expect(SessionService.getSessionAge()).toBeNull();
  });

  it('returns a non-negative number after saving', () => {
    SessionService.saveSession({ documents: [], activeDocumentId: null, uiState: { theme: 'light', fontSize: 14, statusBar: true } });
    const age = SessionService.getSessionAge();
    expect(age).toBeGreaterThanOrEqual(0);
  });
});

describe('SessionService.isSessionExpired', () => {
  beforeEach(() => localStorage.clear());

  it('returns true when no session', () => {
    expect(SessionService.isSessionExpired()).toBe(true);
  });

  it('returns false for a freshly saved session', () => {
    SessionService.saveSession({ documents: [], activeDocumentId: null, uiState: { theme: 'light', fontSize: 14, statusBar: true } });
    expect(SessionService.isSessionExpired(24)).toBe(false);
  });

  it('returns true when max age is 0', () => {
    SessionService.saveSession({ documents: [], activeDocumentId: null, uiState: { theme: 'light', fontSize: 14, statusBar: true } });
    expect(SessionService.isSessionExpired(0)).toBe(true);
  });
});
