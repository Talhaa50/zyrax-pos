import crypto from 'node:crypto';
import db from '../config/database.js';
import { createAuthToken, verifyAuthToken } from '../utils/authToken.js';
import { logger } from '../utils/logger.js';

// PBKDF2 password verification
function verifyPassword(password, hash, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex') === hash);
    });
  });
}

export async function login(req, res) {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Query SQLite for user
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email);

    if (!user) {
      logger('warn', 'Login attempt for non-existent user', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash, user.password_salt);

    if (!valid) {
      logger('warn', 'Failed login attempt', { email, userId: user.id });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = createAuthToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    logger('info', 'User logged in', { userId: user.id, role: user.role });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      expiresIn: 60 * 60 * 24 * 30, // 30 days
    });
  } catch (error) {
    logger('error', 'Login error', { error: error.message });
    return res.status(500).json({ message: 'Login failed' });
  }
}

export function logout(_req, res) {
  res.json({ message: 'Logged out successfully' });
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    const user = verifyAuthToken(auth.slice(7));
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = {
      id: user.sub,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    logger('warn', 'Auth token verification failed', { error: error.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
