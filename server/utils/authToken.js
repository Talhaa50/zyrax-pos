import crypto from 'node:crypto';

// Token TTL: 30 days (previously 12 hours, which caused expired sessions)
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

// Deterministic fallback secret so token verification never crashes
// even when AUTH_SECRET is temporarily unset during startup.
// Production deployments MUST set AUTH_SECRET in .env (≥ 32 chars).
const FALLBACK_SECRET = 'zyrax_pos_local_secret_key_2026_secure_string_here';

function getSecret() {
  const secret = process.env.AUTH_SECRET || FALLBACK_SECRET;
  if (secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters');
  }
  return secret;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createAuthToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  if (!payload.sub || !['admin', 'cashier'].includes(payload.role)) return null;
  return payload;
}
