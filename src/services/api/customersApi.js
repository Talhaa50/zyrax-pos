import { get, post, put, del } from './client.js';

export const customersApi = {
  // Get all customers (with optional search)
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    return get(`/api/customers?${query.toString()}`);
  },

  // Get customer details with full ledger transactions
  getOne: (id) => get(`/api/customers/${id}`),

  // Create customer
  create: (data) => post('/api/customers', data),

  // Update customer
  update: (id, data) => put(`/api/customers/${id}`, data),

  // Add ledger transaction (CREDIT: Wasool/Payment Received, DEBIT: Gave Credit)
  addTransaction: (id, data) => post(`/api/customers/${id}/transaction`, data),

  // Delete customer
  delete: (id) => del(`/api/customers/${id}`),
};
