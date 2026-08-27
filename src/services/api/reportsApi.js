import { get } from './client.js';

export const reportsApi = {
  // Sales summary
  getSalesSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    
    return get(`/api/reports/sales?${query.toString()}`);
  },
  
  // Product performance
  getProductPerformance: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.limit) query.append('limit', params.limit);
    
    return get(`/api/reports/products?${query.toString()}`);
  },
  
  // Inventory summary
  getInventorySummary: () => get('/api/reports/inventory'),
};
