import { get, post, put, del } from './client.js';

export const usersApi = {
  // Get all users (Admin only)
  getAll: () => get('/api/user'),

  // Create new user (Admin only)
  create: (userData) => post('/api/user', userData),

  // Update user details and role (Admin only)
  update: (id, userData) => put(`/api/user/${id}`, userData),

  // Set user password directly (Admin only)
  setPassword: (id, newPassword) => post(`/api/user/${id}/password`, { newPassword }),

  // Delete/Deactivate user (Admin only)
  delete: (id) => del(`/api/user/${id}`),
};
