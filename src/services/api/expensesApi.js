import { get, post, del } from './client.js';

export const expensesApi = {
  // Get expenses with filtering and summary
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    return get(`/api/expenses?${query.toString()}`);
  },

  // Add expense
  create: (data) => post('/api/expenses', data),

  // Delete expense
  delete: (id) => del(`/api/expenses/${id}`),
};
