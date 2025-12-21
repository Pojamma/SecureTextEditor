export interface EncryptionParams {
  iterations: number;
  salt: Uint8Array;
  iv: Uint8Array;
}

export interface EncryptionResult {
  ciphertext: Uint8Array;
  authTag: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
}

export interface DecryptionParams {
  ciphertext: Uint8Array;
  authTag: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
  iterations: number;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';
