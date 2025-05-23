import crypto from 'crypto';

// Encryption key should be set in environment variables in production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sepettakip-encryption-key-dev-only';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts sensitive data
 * @param text Plain text to encrypt
 * @returns Encrypted string
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data for later use in decryption
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Decrypts encrypted data
 * @param encryptedText Encrypted text to decrypt
 * @returns Plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return '';
  
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Checks if a string is already encrypted
 * @param text Text to check
 * @returns Boolean indicating if text is encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  
  // Simple check to see if it matches our encryption format
  const parts = text.split(':');
  return parts.length === 2 && 
    /^[0-9a-f]{32}$/.test(parts[0]) && // IV is 16 bytes = 32 hex chars
    /^[0-9a-f]+$/.test(parts[1]);      // Encrypted data is hex
}

/**
 * Generates a random password
 * @param length Length of password to generate
 * @returns Random password
 */
export function generateRandomPassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
} 