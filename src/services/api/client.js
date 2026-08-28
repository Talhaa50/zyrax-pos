/**
 * HTTP client for direct API communication
 * No IndexedDB, no sync queue, no offline mode
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('retailer_token');

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    // If we get a 401, the token is invalid or expired — clear auth and redirect
    if (res.status === 401) {
      localStorage.removeItem('retailer_session');
      localStorage.removeItem('retailer_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
      const err = await res.json().catch(() => ({ message: 'Unauthorized' }));
      throw new Error(err.message || 'Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || `Request failed: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(`[API] ${options.method || 'GET'} ${path} failed:`, error.message);
    throw error;
  }
}

export function get(path) {
  return request(path, { method: 'GET' });
}

export function post(path, data) {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return request(path, { method: 'POST', body });
}

export function put(path, data) {
  return request(path, { method: 'PUT', body: JSON.stringify(data) });
}

export function del(path) {
  return request(path, { method: 'DELETE' });
}

export function upload(path, file, fieldName = 'image') {
  const formData = new FormData();
  formData.append(fieldName, file);
  return post(path, formData);
}
