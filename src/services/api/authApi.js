import { get, post } from './client.js';

export const authApi = {
  login: (email, password) => post('/api/auth/login', { email, password }),
  logout: () => post('/api/auth/logout', {}),
};
