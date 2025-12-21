export interface DocumentMetadata {
  created: string;
  modified: string;
  filename: string;
}

export interface PlainDocument {
  version: '1.0';
  encrypted: false;
  content: string;
  metadata: DocumentMetadata;
}

export interface EncryptedDocument {
  version: '1.0';
  encrypted: true;
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  kdfParams: {
    iterations: 600000;
    salt: string; // Base64 encoded
  };
  iv: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
  authTag: string; // Base64 encoded (GCM auth tag)
  metadata: DocumentMetadata;
}

export type Document = PlainDocument | EncryptedDocument;

export interface OpenDocument {
  id: string;
  path: string;
  source: 'local' | 'drive' | 'temp';
  encrypted: boolean;
  content: string;
  modified: boolean;
  cursorPosition: number;
  scrollPosition: number;
  metadata: DocumentMetadata;
}
