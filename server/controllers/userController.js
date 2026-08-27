import crypto from 'node:crypto';
import db from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Hash password with PBKDF2
 */
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt: salt,
      });
    });
  });
}

/**
 * Verify password
 */
export function verifyPassword(password, hash, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex') === hash);
    });
  });
}

/**
 * Change own password (for authenticated user)
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters' 
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await verifyPassword(
      currentPassword, 
      user.password_hash, 
      user.password_salt
    );

    if (!isValid) {
      logger('warn', 'Failed password change attempt', { userId });
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const { hash, salt } = await hashPassword(newPassword);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, password_salt = ?
      WHERE id = ?
    `).run(hash, salt, userId);

    logger('info', 'Password changed', { userId });
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger('error', 'Password change failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to change password' });
  }
}

/**
 * Get current user profile
 */
export function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const user = db.prepare(`
      SELECT id, name, email, role, active, created_at
      FROM users 
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    logger('error', 'Failed to fetch profile', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

/**
 * Update user profile
 */
export function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = db.prepare(
      'SELECT id FROM users WHERE email = ? AND id != ?'
    ).get(email.trim().toLowerCase(), userId);

    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?
      WHERE id = ?
    `).run(name.trim(), email.trim().toLowerCase(), userId);

    logger('info', 'Profile updated', { userId });
    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    logger('error', 'Profile update failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin User Management Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all users (Admin only)
 */
export function getAllUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, active, created_at
      FROM users
      ORDER BY role ASC, created_at DESC
    `).all();

    return res.json(users);
  } catch (error) {
    logger('error', 'Failed to fetch users list', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
}

/**
 * Create user (Admin only)
 */
export async function createUser(req, res) {
  try {
    const { name, email, role = 'cashier', password, active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!['admin', 'cashier'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin or cashier' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email is already taken
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const { hash, salt } = await hashPassword(password);
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, role, password_hash, password_salt, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      cleanEmail,
      role,
      hash,
      salt,
      active ? 1 : 0,
      createdAt
    );

    logger('info', 'New user created by admin', { createdUserId: userId, createdBy: req.user.id, role });

    return res.status(201).json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        role,
        active: active ? 1 : 0,
        created_at: createdAt,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    logger('error', 'Create user failed', { error: error.message });
    return res.status(500).json({ message: error.message || 'Failed to create user' });
  }
}

/**
 * Update user details & role (Admin only)
 */
export function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, active } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if another user already has this email
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(cleanEmail, id);
    if (existing) {
      return res.status(409).json({ message: 'Email is already used by another user' });
    }

    // Role validation
    const updatedRole = ['admin', 'cashier'].includes(role) ? role : user.role;
    const updatedActive = typeof active !== 'undefined' ? (active ? 1 : 0) : user.active;

    // Prevent deactivating own account
    if (req.user.id === id && updatedActive === 0) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, active = ?
      WHERE id = ?
    `).run(name.trim(), cleanEmail, updatedRole, updatedActive, id);

    logger('info', 'User updated by admin', { targetUserId: id, updatedBy: req.user.id });

    return res.json({
      success: true,
      user: {
        id,
        name: name.trim(),
        email: cleanEmail,
        role: updatedRole,
        active: updatedActive,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    logger('error', 'Update user failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

/**
 * Admin directly sets/resets user password (Admin only)
 */
export async function setUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters' 
      });
    }

    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { hash, salt } = await hashPassword(newPassword);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, password_salt = ?
      WHERE id = ?
    `).run(hash, salt, id);

    logger('info', 'Admin reset user password', { targetUserId: id, adminId: req.user.id });

    return res.json({ 
      success: true, 
      message: `Password updated successfully for ${user.name}` 
    });
  } catch (error) {
    logger('error', 'Set user password failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to set user password' });
  }
}

/**
 * Delete user (Admin only)
 */
export function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sales attached
    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales WHERE cashier_id = ?').get(id);

    if (salesCount.count > 0) {
      // Soft-deactivate to maintain integrity of past sales records
      db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id);
      logger('info', 'User deactivated due to existing sales history', { userId: id });
      return res.json({ 
        success: true, 
        message: `User ${user.name} has sales history and was deactivated` 
      });
    } else {
      // Hard delete if no sales records
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      logger('info', 'User deleted from database', { userId: id });
      return res.json({ 
        success: true, 
        message: `User ${user.name} deleted successfully` 
      });
    }
  } catch (error) {
    logger('error', 'Delete user failed', { error: error.message });
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}
