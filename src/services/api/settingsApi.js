import { get, put } from './client.js';

export const settingsApi = {
  // Get business settings
  getSettings: () => get('/api/settings'),
  
  // Update business settings
  updateSettings: (settings) => put('/api/settings', settings),
};
