import crypto from 'node:crypto';
import { createAuthToken, verifyAuthToken } from '../utils/authToken.js';

const USERS = {
  admin: { id: 'admin_1', name: 'Admin User', email: 'admin@retailer.com', role: 'admin' },
  cashier: { id: 'cashier_1', name: 'Cashier User', email: 'cashier@retailer.com', role: 'cashier' },
};

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getConfiguredUser(email) {
  if (email === USERS.admin.email) {
    return process.env.RETAILER_ADMIN_PASSWORD ? USERS.admin : null;
  }
  if (email === USERS.cashier.email) {
    return process.env.RETAILER_CASHIER_PASSWORD ? USERS.cashier : null;
  }
  return null;
}

export function login(req, res) {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;
  const user = getConfiguredUser(email);

  if (!user || !safeEqual(password, email === USERS.admin.email
    ? process.env.RETAILER_ADMIN_PASSWORD
    : process.env.RETAILER_CASHIER_PASSWORD)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const token = createAuthToken(user);
    return res.json({ user, token, expiresIn: 60 * 60 * 12 });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
}

export function logout(_req, res) {
  res.json({ message: 'Logged out' });
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = verifyAuthToken(auth.slice(7));
    if (!user) return res.status(401).json({ message: 'Invalid or expired token' });
    req.user = {
      id: user.sub,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
