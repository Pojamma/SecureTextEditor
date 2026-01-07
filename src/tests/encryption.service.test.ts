import { describe, it, expect, beforeEach } from 'vitest';
import {
  EncryptionService,
  encryptDocument,
  decryptDocument,
  validatePassword,
  isEncrypted,
  encryptToBinary,
  decryptFromBinary,
  isBinaryEncrypted,
  binaryToBase64,
  base64ToBinary,
} from '@/services/encryption.service';
import type { PlainDocument } from '@/types/document.types';

describe('Encryption Service', () => {
  let samplePlainDocument: PlainDocument;
  let testPassword: string;

  beforeEach(() => {
    testPassword = 'TestPassword123!';
    samplePlainDocument = {
      content: 'This is a test document with some content.',
      metadata: {
        filename: 'test.txt',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
    };
  });

  describe('encryptDocument', () => {
    it('should encrypt a plain document successfully', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.version).toBe(1);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.metadata.encrypted).toBe(true);
      expect(encrypted.metadata.encryptedAt).toBeDefined();
    });

    it('should generate unique ciphertext for same content with different encryptions', async () => {
      const encrypted1 = await encryptDocument(samplePlainDocument, testPassword);
      const encrypted2 = await encryptDocument(samplePlainDocument, testPassword);

      // Ciphertext should be different (unique IV and salt)
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should throw error for password shorter than 3 characters', async () => {
      await expect(encryptDocument(samplePlainDocument, 'ab')).rejects.toThrow(
        'Password must be at least 3 characters long'
      );
    });

    it('should throw error for empty password', async () => {
      await expect(encryptDocument(samplePlainDocument, '')).rejects.toThrow(
        'Password must be at least 3 characters long'
      );
    });

    it('should preserve filename in metadata', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);
      expect(encrypted.metadata.filename).toBe(samplePlainDocument.metadata.filename);
    });

    it('should handle large documents', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const largeDoc: PlainDocument = {
        ...samplePlainDocument,
        content: largeContent,
      };

      const encrypted = await encryptDocument(largeDoc, testPassword);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    });

    it('should handle special characters in content', async () => {
      const specialDoc: PlainDocument = {
        ...samplePlainDocument,
        content: '测试 🔐 Special chars: !@#$%^&*(){}[]|\\:";\'<>?,./`~',
      };

      const encrypted = await encryptDocument(specialDoc, testPassword);
      expect(encrypted.ciphertext).toBeDefined();
    });
  });

  describe('decryptDocument', () => {
    it('should decrypt an encrypted document with correct password', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);
      const decrypted = await decryptDocument(encrypted, testPassword);

      expect(decrypted.content).toBe(samplePlainDocument.content);
      expect(decrypted.metadata.filename).toBe(samplePlainDocument.metadata.filename);
    });

    it('should throw error with wrong password', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);

      await expect(decryptDocument(encrypted, 'WrongPassword')).rejects.toThrow(
        'Failed to decrypt document'
      );
    });

    it('should throw error for empty password', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);

      await expect(decryptDocument(encrypted, '')).rejects.toThrow(
        'Password is required for decryption'
      );
    });

    it('should throw error for unsupported version', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);
      const futureVersion = { ...encrypted, version: 999 };

      await expect(decryptDocument(futureVersion, testPassword)).rejects.toThrow(
        'Unsupported file format version'
      );
    });

    it('should handle corrupted ciphertext', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);
      const corrupted = {
        ...encrypted,
        ciphertext: 'corrupted-data-that-is-invalid',
      };

      await expect(decryptDocument(corrupted, testPassword)).rejects.toThrow();
    });

    it('should handle large encrypted documents', async () => {
      const largeContent = 'Lorem ipsum '.repeat(100000); // ~1.2MB
      const largeDoc: PlainDocument = {
        ...samplePlainDocument,
        content: largeContent,
      };

      const encrypted = await encryptDocument(largeDoc, testPassword);
      const decrypted = await decryptDocument(encrypted, testPassword);

      expect(decrypted.content).toBe(largeContent);
    });

    it('should preserve special characters after encryption/decryption', async () => {
      const specialDoc: PlainDocument = {
        ...samplePlainDocument,
        content: '🔐 Emoji, 中文, العربية, עברית, Ελληνικά, Русский',
      };

      const encrypted = await encryptDocument(specialDoc, testPassword);
      const decrypted = await decryptDocument(encrypted, testPassword);

      expect(decrypted.content).toBe(specialDoc.content);
    });
  });

  describe('encryptToBinary', () => {
    it('should encrypt text to binary format', async () => {
      const plaintext = 'Test content for binary encryption';
      const encrypted = await encryptToBinary(plaintext, testPassword);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should generate unique binary for same content', async () => {
      const plaintext = 'Test content';
      const encrypted1 = await encryptToBinary(plaintext, testPassword);
      const encrypted2 = await encryptToBinary(plaintext, testPassword);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for short password', async () => {
      await expect(encryptToBinary('content', 'ab')).rejects.toThrow(
        'Password must be at least 3 characters long'
      );
    });

    it('should handle empty content', async () => {
      const encrypted = await encryptToBinary('', testPassword);
      expect(encrypted).toBeDefined();
    });

    it('should handle large content', async () => {
      const largeContent = 'x'.repeat(5 * 1024 * 1024); // 5MB
      const encrypted = await encryptToBinary(largeContent, testPassword);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decryptFromBinary', () => {
    it('should decrypt binary encrypted data with correct password', async () => {
      const plaintext = 'Test binary encryption/decryption';
      const encrypted = await encryptToBinary(plaintext, testPassword);
      const decrypted = await decryptFromBinary(encrypted, testPassword);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error with wrong password', async () => {
      const plaintext = 'Secret content';
      const encrypted = await encryptToBinary(plaintext, testPassword);

      await expect(decryptFromBinary(encrypted, 'WrongPassword')).rejects.toThrow(
        'Failed to decrypt file'
      );
    });

    it('should throw error for empty password', async () => {
      const plaintext = 'Content';
      const encrypted = await encryptToBinary(plaintext, testPassword);

      await expect(decryptFromBinary(encrypted, '')).rejects.toThrow(
        'Password is required for decryption'
      );
    });

    it('should throw error for invalid binary format', async () => {
      await expect(decryptFromBinary('invalid-binary-data', testPassword)).rejects.toThrow();
    });

    it('should throw error for too short binary data', async () => {
      const shortData = btoa('short');
      await expect(decryptFromBinary(shortData, testPassword)).rejects.toThrow();
    });

    it('should handle special characters in binary encryption', async () => {
      const specialText = '🔐测试العربية';
      const encrypted = await encryptToBinary(specialText, testPassword);
      const decrypted = await decryptFromBinary(encrypted, testPassword);

      expect(decrypted).toBe(specialText);
    });

    it('should handle large binary content', async () => {
      const largeContent = 'Lorem '.repeat(200000); // ~1.2MB
      const encrypted = await encryptToBinary(largeContent, testPassword);
      const decrypted = await decryptFromBinary(encrypted, testPassword);

      expect(decrypted).toBe(largeContent);
    });
  });

  describe('validatePassword', () => {
    it('should validate empty password as invalid', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.message).toBe('Password is required');
    });

    it('should validate short password as invalid', () => {
      const result = validatePassword('ab');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.message).toContain('at least 3 characters');
    });

    it('should validate weak password', () => {
      const result = validatePassword('password');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('weak');
    });

    it('should validate medium password', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should validate strong password', () => {
      const result = validatePassword('P@ssw0rd123!');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should require multiple character types for strong password', () => {
      const result = validatePassword('aaaaaaaaaaaaaa'); // Long but no variety
      expect(result.strength).toBe('weak');
    });

    it('should recognize uppercase requirement', () => {
      const weak = validatePassword('password123'); // lowercase + numbers
      const better = validatePassword('Password123'); // uppercase + lowercase + numbers

      // With length 11 and 2 criteria (lowercase + numbers), it's still weak
      // With length 11 and 3 criteria (upper + lower + numbers), it should be medium
      expect(['weak', 'medium']).toContain(weak.strength);
      expect(['medium', 'strong']).toContain(better.strength);
    });

    it('should recognize special character requirement', () => {
      const medium = validatePassword('Password123');
      const strong = validatePassword('Password123!');

      expect(medium.strength).toBe('medium');
      expect(strong.strength).toBe('strong');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted document', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain document', () => {
      expect(isEncrypted(samplePlainDocument)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isEncrypted(null as any)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEncrypted(undefined as any)).toBe(false);
    });

    it('should return false for object without required fields', () => {
      const fakeDoc = { encrypted: true, ciphertext: 'abc' }; // missing salt and iv
      expect(isEncrypted(fakeDoc)).toBe(false);
    });

    it('should return false for object with encrypted: false', () => {
      const notEncrypted = {
        encrypted: false,
        ciphertext: 'abc',
        salt: 'def',
        iv: 'ghi',
      };
      expect(isEncrypted(notEncrypted)).toBe(false);
    });
  });

  describe('isBinaryEncrypted', () => {
    it('should return true for valid encrypted binary', async () => {
      const encrypted = await encryptToBinary('test', testPassword);
      expect(isBinaryEncrypted(encrypted)).toBe(true);
    });

    it('should return false for invalid binary', () => {
      expect(isBinaryEncrypted('invalid-data')).toBe(false);
    });

    it('should return false for too short binary', () => {
      const shortData = btoa('short');
      expect(isBinaryEncrypted(shortData)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isBinaryEncrypted('')).toBe(false);
    });

    it('should return false for non-base64 string', () => {
      expect(isBinaryEncrypted('not-valid-base64!@#$%')).toBe(false);
    });
  });

  describe('base64 conversion', () => {
    it('should convert binary to base64 and back', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 128, 0]);
      const base64 = binaryToBase64(original);
      const restored = base64ToBinary(base64);

      expect(restored).toEqual(original);
    });

    it('should handle empty array', () => {
      const empty = new Uint8Array([]);
      const base64 = binaryToBase64(empty);
      const restored = base64ToBinary(base64);

      expect(restored.length).toBe(0);
    });

    it('should handle large binary data', () => {
      const large = new Uint8Array(10000);
      for (let i = 0; i < large.length; i++) {
        large[i] = i % 256;
      }

      const base64 = binaryToBase64(large);
      const restored = base64ToBinary(base64);

      expect(restored).toEqual(large);
    });
  });

  describe('encryption consistency', () => {
    it('should produce different IV for each encryption', async () => {
      const encrypted1 = await encryptDocument(samplePlainDocument, testPassword);
      const encrypted2 = await encryptDocument(samplePlainDocument, testPassword);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should produce different salt for each encryption', async () => {
      const encrypted1 = await encryptDocument(samplePlainDocument, testPassword);
      const encrypted2 = await encryptDocument(samplePlainDocument, testPassword);

      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should encrypt and decrypt consistently 10 times', async () => {
      const testDoc: PlainDocument = {
        content: 'Consistency test content',
        metadata: {
          filename: 'test.txt',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };

      // Reduced from 100 to 10 to avoid timeout with 600,000 PBKDF2 iterations
      for (let i = 0; i < 10; i++) {
        const encrypted = await encryptDocument(testDoc, testPassword);
        const decrypted = await decryptDocument(encrypted, testPassword);
        expect(decrypted.content).toBe(testDoc.content);
      }
    }, 10000); // 10s timeout
  });

  describe('security properties', () => {
    it('should use PBKDF2 with 600,000 iterations', () => {
      expect(EncryptionService._test.PBKDF2_ITERATIONS).toBe(600000);
    });

    it('should not decrypt with slightly different password', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, 'Password123');

      await expect(decryptDocument(encrypted, 'Password124')).rejects.toThrow();
      await expect(decryptDocument(encrypted, 'password123')).rejects.toThrow();
      await expect(decryptDocument(encrypted, 'Password 123')).rejects.toThrow();
    });

    it('should prevent tampering by failing to decrypt modified ciphertext', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);

      // Modify ciphertext
      const tamperedCiphertext = encrypted.ciphertext.slice(0, -5) + 'AAAAA';
      const tampered = { ...encrypted, ciphertext: tamperedCiphertext };

      await expect(decryptDocument(tampered, testPassword)).rejects.toThrow();
    });

    it('should prevent tampering by failing to decrypt modified IV', async () => {
      const encrypted = await encryptDocument(samplePlainDocument, testPassword);

      // Modify IV
      const tamperedIV = encrypted.iv.slice(0, -5) + 'AAAAA';
      const tampered = { ...encrypted, iv: tamperedIV };

      await expect(decryptDocument(tampered, testPassword)).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle document with empty content', async () => {
      const emptyDoc: PlainDocument = {
        content: '',
        metadata: {
          filename: 'empty.txt',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      };

      const encrypted = await encryptDocument(emptyDoc, testPassword);
      const decrypted = await decryptDocument(encrypted, testPassword);

      expect(decrypted.content).toBe('');
    });

    it('should handle document with only whitespace', async () => {
      const whitespaceDoc: PlainDocument = {
        ...samplePlainDocument,
        content: '   \n\n\t\t  \n',
      };

      const encrypted = await encryptDocument(whitespaceDoc, testPassword);
      const decrypted = await decryptDocument(encrypted, testPassword);

      expect(decrypted.content).toBe(whitespaceDoc.content);
    });

    it('should handle document with newlines and tabs', async () => {
      const formattedDoc: PlainDocument = {
        ...samplePlainDocument,
        content: 'Line 1\nLine 2\n\tIndented\n\n\nMultiple breaks',
      };

      const encrypted = await encryptDocument(formattedDoc, testPassword);
      const decrypted = await decryptDocument(encrypted, testPassword);

      expect(decrypted.content).toBe(formattedDoc.content);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const encrypted = await encryptDocument(samplePlainDocument, longPassword);
      const decrypted = await decryptDocument(encrypted, longPassword);

      expect(decrypted.content).toBe(samplePlainDocument.content);
    });

    it('should handle passwords with special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~测试🔐';
      const encrypted = await encryptDocument(samplePlainDocument, specialPassword);
      const decrypted = await decryptDocument(encrypted, specialPassword);

      expect(decrypted.content).toBe(samplePlainDocument.content);
    });
  });

  describe('performance', () => {
    it('should encrypt 1MB document in reasonable time', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const largeDoc: PlainDocument = {
        ...samplePlainDocument,
        content: largeContent,
      };

      const startTime = performance.now();
      await encryptDocument(largeDoc, testPassword);
      const duration = performance.now() - startTime;

      // Should complete in less than 5 seconds (generous timeout)
      expect(duration).toBeLessThan(5000);
    }, 10000); // 10s timeout

    it('should decrypt 1MB document in reasonable time', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const largeDoc: PlainDocument = {
        ...samplePlainDocument,
        content: largeContent,
      };

      const encrypted = await encryptDocument(largeDoc, testPassword);

      const startTime = performance.now();
      await decryptDocument(encrypted, testPassword);
      const duration = performance.now() - startTime;

      // Should complete in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 10000); // 10s timeout
  });
});
