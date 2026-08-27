import { get, post } from './client.js';

export const salesApi = {
  // Get all sales
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.cashier_id) query.append('cashier_id', params.cashier_id);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.limit) query.append('limit', params.limit);
    
    return get(`/api/sales?${query.toString()}`);
  },
  
  // Get single sale
  getOne: (id) => get(`/api/sales/${id}`),
  
  // Get sale items
  getItems: (id) => get(`/api/sales/${id}/items`),
  
  // Create sale
  create: (sale, items) => post('/api/sales', { sale, items }),
};
