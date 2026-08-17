const PBKDF2_ITERATIONS = 120_000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256;

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}

export async function hashPassword(password, saltBytes = crypto.getRandomValues(new Uint8Array(16))) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    KEY_LENGTH
  );

  return {
    passwordHash: bytesToBase64(new Uint8Array(bits)),
    passwordSalt: bytesToBase64(saltBytes),
    passwordAlgorithm: `PBKDF2-${HASH_ALGORITHM}-${PBKDF2_ITERATIONS}`,
  };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  if (!storedHash || !storedSalt) return false;
  const result = await hashPassword(password, base64ToBytes(storedSalt));
  return constantTimeEqual(base64ToBytes(result.passwordHash), base64ToBytes(storedHash));
}
