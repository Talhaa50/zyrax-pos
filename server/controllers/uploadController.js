import { logger } from '../utils/logger.js';
import { unlink } from 'fs/promises';
import path from 'path';

/**
 * Handle product image upload
 */
export async function uploadProductImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    logger('info', 'Product image uploaded', { 
      filename: req.file.filename,
      size: req.file.size 
    });

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    logger('error', 'Image upload failed', { error: error.message });
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
}

/**
 * Delete product image
 */
export async function deleteProductImage(req, res) {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
    
    await unlink(filePath);
    
    logger('info', 'Product image deleted', { filename });

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    logger('error', 'Image deletion failed', { error: error.message });
    res.status(500).json({ message: 'Image deletion failed', error: error.message });
  }
}
