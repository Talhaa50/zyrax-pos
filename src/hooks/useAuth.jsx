import { useState, useCallback, useEffect, useContext, createContext } from 'react';
import { authApi } from '../services/api/authApi';
import { ROLES } from '../constants/roles';

const SESSION_KEY = 'retailer_session';
const TOKEN_KEY = 'retailer_token';

// ── Token Expiry Helper ──────────────────────────────────────────────────────
function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const [encoded] = token.split('.');
    if (!encoded) return true;
    // base64url → base64 → JSON (browser-safe, no Buffer dependency)
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (!payload.exp) return true;
    return payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

function getStoredSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || isTokenExpired(token)) {
      // Stale or expired — wipe it
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredSession);
  const [loading, setLoading] = useState(false);

  // Clear auth state and localStorage
  const clearAuth = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Listen for 401 events dispatched by the API client
  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  // Sync auth state across browser tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          setUser(null);
        } else {
          const raw = localStorage.getItem(SESSION_KEY);
          setUser(raw ? JSON.parse(raw) : null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login(email.trim().toLowerCase(), password);

      localStorage.setItem(SESSION_KEY, JSON.stringify(response.user));
      localStorage.setItem(TOKEN_KEY, response.token);

      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('[Auth] Login failed:', error.message);
      throw new Error(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('[Auth] Logout request failed:', error.message);
    }
    clearAuth();
  }, [clearAuth]);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCashier = user?.role === ROLES.CASHIER;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isCashier,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
