import { get, post } from './client.js';

export const inventoryApi = {
  // Get stock levels
  getStockLevels: (lowStock = false) => 
    get(`/api/inventory/stock?lowStock=${lowStock}`),
  
  // Get inventory logs
  getLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.product_id) query.append('product_id', params.product_id);
    if (params.type) query.append('type', params.type);
    if (params.limit) query.append('limit', params.limit);
    
    return get(`/api/inventory/logs?${query.toString()}`);
  },
  
  // Adjust inventory
  adjust: (adjustment) => post('/api/inventory/adjust', adjustment),
};
