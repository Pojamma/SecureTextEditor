export interface DocumentMetadata {
  created: string;
  modified: string;
  filename: string;
  encrypted?: boolean;
  encryptedAt?: string;
}

export interface PlainDocument {
  content: string;
  metadata: DocumentMetadata;
}

export interface EncryptedDocument {
  version: number;
  encrypted: true;
  ciphertext: string; // Base64 encoded (includes GCM auth tag)
  salt: string; // Base64 encoded (for PBKDF2)
  iv: string; // Base64 encoded (96-bit nonce)
  metadata: DocumentMetadata;
}

export type Document = PlainDocument | EncryptedDocument;

export interface OpenDocument {
  id: string;
  path: string;
  source: 'local' | 'drive' | 'temp' | 'external';
  encrypted: boolean;
  content: string;
  modified: boolean;
  cursorPosition: number;
  scrollPosition: number;
  metadata: DocumentMetadata;
  externalUri?: string; // URI for external files (content:// on Android, file:// on Windows)
}
