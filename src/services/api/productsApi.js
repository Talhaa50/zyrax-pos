import { get, post, put, del, upload } from './client.js';

export const productsApi = {
  // Get all products
  getAll: (includeArchived = false) => 
    get(`/api/products?includeArchived=${includeArchived}`),
  
  // Get single product
  getOne: (id) => get(`/api/products/${id}`),
  
  // Search products
  search: (query) => get(`/api/products/search?q=${encodeURIComponent(query)}`),
  
  // Create product
  create: (product) => post('/api/products', product),
  
  // Update product
  update: (id, product) => put(`/api/products/${id}`, product),
  
  // Archive product (soft delete)
  archive: (id) => del(`/api/products/${id}`),
  
  // Upload product image
  uploadImage: (file) => upload('/api/upload/products', file, 'image'),
  
  // Get image URL
  getImageUrl: (filename) => 
    filename ? `/uploads/products/${filename}` : null,
};
