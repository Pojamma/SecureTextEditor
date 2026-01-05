/**
 * Encryption Service
 *
 * Implements AES-256-GCM encryption for document security
 * Uses PBKDF2-SHA256 for key derivation with 600,000 iterations
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV (96-bit) for each encryption
 * - Unique salt (128-bit) for each document
 * - PBKDF2 with 600,000 iterations
 * - Authentication tag prevents tampering
 */

import { EncryptedDocument, PlainDocument } from '@/types/document.types';

// Constants
const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const KEY_LENGTH = 256; // bits
const FILE_FORMAT_VERSION = 1;

/**
 * Generate cryptographically secure random bytes
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

/**
 * Convert binary data (Uint8Array) to base64 string for storage/transmission
 */
export function binaryToBase64(bytes: Uint8Array): string {
  return uint8ArrayToBase64(bytes);
}

/**
 * Convert base64 string back to binary data (Uint8Array)
 */
export function base64ToBinary(base64: string): Uint8Array {
  return base64ToUint8Array(base64);
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt plain text using AES-256-GCM
 */
async function encryptText(
  plaintext: string,
  password: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  try {
    // Generate random salt and IV
    const salt = getRandomBytes(SALT_LENGTH);
    const iv = getRandomBytes(IV_LENGTH);

    // Derive encryption key
    const key = await deriveKey(password, salt);

    // Convert plaintext to bytes
    const plaintextBytes = stringToUint8Array(plaintext);

    // Encrypt using AES-GCM
    const ciphertextBytes = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      plaintextBytes as BufferSource
    );

    // Convert to base64 for storage
    return {
      ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBytes)),
      salt: uint8ArrayToBase64(salt),
      iv: uint8ArrayToBase64(iv),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt document');
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
async function decryptText(
  ciphertext: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> {
  try {
    // Convert base64 to bytes
    const ciphertextBytes = base64ToUint8Array(ciphertext);
    const saltBytes = base64ToUint8Array(salt);
    const ivBytes = base64ToUint8Array(iv);

    // Derive decryption key
    const key = await deriveKey(password, saltBytes);

    // Decrypt using AES-GCM
    const plaintextBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes as BufferSource,
      },
      key,
      ciphertextBytes as BufferSource
    );

    // Convert bytes to string
    return uint8ArrayToString(new Uint8Array(plaintextBytes));
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt document. Wrong password or corrupted file.');
  }
}

/**
 * Encrypt a document
 */
export async function encryptDocument(
  document: PlainDocument,
  password: string
): Promise<EncryptedDocument> {
  if (!password || password.length < 3) {
    throw new Error('Password must be at least 3 characters long');
  }

  // Serialize document content
  const plaintext = JSON.stringify({
    content: document.content,
    metadata: document.metadata,
  });

  // Encrypt the content
  const { ciphertext, salt, iv } = await encryptText(plaintext, password);

  // Create encrypted document
  const encryptedDoc: EncryptedDocument = {
    version: FILE_FORMAT_VERSION,
    encrypted: true,
    ciphertext,
    salt,
    iv,
    metadata: {
      filename: document.metadata.filename,
      created: document.metadata.created,
      modified: new Date().toISOString(),
      encrypted: true,
      encryptedAt: new Date().toISOString(),
    },
  };

  return encryptedDoc;
}

/**
 * Decrypt a document
 */
export async function decryptDocument(
  encryptedDoc: EncryptedDocument,
  password: string
): Promise<PlainDocument> {
  if (!password) {
    throw new Error('Password is required for decryption');
  }

  // Check version compatibility
  if (encryptedDoc.version > FILE_FORMAT_VERSION) {
    throw new Error('Unsupported file format version. Please update the app.');
  }

  // Decrypt the content
  const plaintext = await decryptText(
    encryptedDoc.ciphertext,
    password,
    encryptedDoc.salt,
    encryptedDoc.iv
  );

  // Parse decrypted content
  let parsedContent;
  try {
    parsedContent = JSON.parse(plaintext);
  } catch (error) {
    throw new Error('Failed to parse decrypted document. File may be corrupted.');
  }

  // Create plain document
  const plainDoc: PlainDocument = {
    content: parsedContent.content,
    metadata: {
      ...parsedContent.metadata,
      modified: new Date().toISOString(),
    },
  };

  return plainDoc;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} {
  if (!password) {
    return { valid: false, strength: 'weak', message: 'Password is required' };
  }

  if (password.length < 3) {
    return {
      valid: false,
      strength: 'weak',
      message: 'Password must be at least 3 characters long',
    };
  }

  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

  const criteriaCount =
    [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

  if (password.length >= 12 && criteriaCount >= 3) {
    strength = 'strong';
  } else if (password.length >= 10 && criteriaCount >= 2) {
    strength = 'medium';
  }

  return {
    valid: true,
    strength,
    message:
      strength === 'strong'
        ? 'Strong password'
        : strength === 'medium'
        ? 'Medium strength password'
        : 'Weak password. Consider adding uppercase, numbers, and symbols.',
  };
}

/**
 * Check if a file is encrypted
 */
export function isEncrypted(data: any): data is EncryptedDocument {
  return !!(
    data &&
    typeof data === 'object' &&
    data.encrypted === true &&
    'ciphertext' in data &&
    'salt' in data &&
    'iv' in data
  );
}

/**
 * Encrypt text to binary format (for .enc files)
 * Returns base64-encoded binary data: [salt(16)][iv(12)][ciphertext]
 */
export async function encryptToBinary(plaintext: string, password: string): Promise<string> {
  if (!password || password.length < 3) {
    throw new Error('Password must be at least 3 characters long');
  }

  try {
    // Generate random salt and IV
    const salt = getRandomBytes(SALT_LENGTH);
    const iv = getRandomBytes(IV_LENGTH);

    // Derive encryption key
    const key = await deriveKey(password, salt);

    // Convert plaintext to bytes
    const plaintextBytes = stringToUint8Array(plaintext);

    // Encrypt using AES-GCM
    const ciphertextBytes = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      plaintextBytes as BufferSource
    );

    // Combine: salt + iv + ciphertext
    const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertextBytes.byteLength);
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(ciphertextBytes), SALT_LENGTH + IV_LENGTH);

    // Return as base64 for transmission
    return uint8ArrayToBase64(combined);
  } catch (error) {
    console.error('Binary encryption failed:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt binary format (from .enc files)
 * Expects base64-encoded binary data: [salt(16)][iv(12)][ciphertext]
 */
export async function decryptFromBinary(binaryData: string, password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required for decryption');
  }

  try {
    // Decode from base64
    const combined = base64ToUint8Array(binaryData);

    // Check minimum length
    if (combined.length < SALT_LENGTH + IV_LENGTH) {
      throw new Error('Invalid encrypted file format');
    }

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive decryption key
    const key = await deriveKey(password, salt);

    // Decrypt using AES-GCM
    const plaintextBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    // Convert bytes to string
    return uint8ArrayToString(new Uint8Array(plaintextBytes));
  } catch (error) {
    console.error('Binary decryption failed:', error);
    throw new Error('Failed to decrypt file. Wrong password or corrupted file.');
  }
}

/**
 * Check if binary data looks like an encrypted file
 * Returns true if it has the minimum expected length
 */
export function isBinaryEncrypted(binaryData: string): boolean {
  try {
    const combined = base64ToUint8Array(binaryData);
    // Must have at least salt + iv + some ciphertext
    return combined.length >= SALT_LENGTH + IV_LENGTH + 16;
  } catch {
    return false;
  }
}

/**
 * Export for testing
 */
export const EncryptionService = {
  encryptDocument,
  decryptDocument,
  validatePassword,
  isEncrypted,
  encryptToBinary,
  decryptFromBinary,
  isBinaryEncrypted,
  binaryToBase64,
  base64ToBinary,
  // Export for testing purposes
  _test: {
    encryptText,
    decryptText,
    deriveKey,
    PBKDF2_ITERATIONS,
  },
};
