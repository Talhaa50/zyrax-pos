const MAX_WIDTH = 480;
const MAX_HEIGHT = 480;
const JPEG_QUALITY = 0.82;
const MAX_BYTES = 200_000;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Please select a valid image file'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = JPEG_QUALITY;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      while (dataUrl.length > MAX_BYTES && quality > 0.4) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

const API_BASE = typeof window !== 'undefined'
  ? (import.meta.env?.VITE_API_URL || 'http://localhost:3001')
  : 'http://localhost:3001';

// Build a URL for a product image stored on the Express server
export function getProductImageSrc(product) {
  if (!product) return null;
  const imageId = product.image_id;
  if (!imageId) return null;
  // Already a full URL or data URI (legacy)
  if (imageId.startsWith('http') || imageId.startsWith('data:')) return imageId;
  return `${API_BASE}/uploads/products/${imageId}`;
}
