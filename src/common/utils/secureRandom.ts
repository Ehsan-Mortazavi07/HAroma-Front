const PASSWORD_CHARACTERS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';

/** Generate a password with browser cryptographic randomness and no modulo bias. */
export function generateSecurePassword(length = 16): string {
  if (!Number.isInteger(length) || length < 12 || length > 128) {
    throw new RangeError('Password length must be between 12 and 128 characters.');
  }

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure password generation is unavailable in this browser.');
  }

  const largestAcceptableByte = Math.floor(256 / PASSWORD_CHARACTERS.length) * PASSWORD_CHARACTERS.length;
  let password = '';
  const bytes = new Uint8Array(Math.max(length * 2, 32));

  while (password.length < length) {
    cryptoApi.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= largestAcceptableByte) continue;
      password += PASSWORD_CHARACTERS[byte % PASSWORD_CHARACTERS.length];
      if (password.length === length) break;
    }
  }

  return password;
}
