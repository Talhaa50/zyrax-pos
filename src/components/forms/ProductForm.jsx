import { useState, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { validateProduct } from '../../utils/validators';
import { productsApi } from '../../services/api/productsApi';

const empty = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  cost_price: '',
  selling_price: '',
  quantity: '',
  reorder_level: '10',
  image_id: '',
};

// Build a URL for an image filename stored on the server
function getImageUrl(imageId) {
  if (!imageId) return null;
  // If it's already a full URL or data URL, return as-is
  if (imageId.startsWith('http') || imageId.startsWith('data:')) return imageId;
  return `/uploads/products/${imageId}`;
}

export default function ProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...empty, ...initial });
  const [previewUrl, setPreviewUrl] = useState(getImageUrl(initial?.image_id) || null);
  const [pendingFile, setPendingFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState('');
  const fileRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB');
      return;
    }

    // Show local preview immediately, track the file for upload on submit
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    setForm({ ...form, image_id: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProduct(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    let image_id = form.image_id;

    // Upload the file to the server if a new one was selected
    if (pendingFile) {
      try {
        const result = await productsApi.uploadImage(pendingFile);
        image_id = result.filename;
      } catch (err) {
        setImageError('Image upload failed: ' + err.message);
        return;
      }
    }

    onSubmit({ ...form, image_id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">

        {/* Image panel */}
        <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-black/20">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-medium text-gray-400">No image</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Product Image</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 dark:file:text-brand-300"
            />
            {previewUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={removeImage}>Remove image</Button>
            )}
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            <p className="text-xs text-gray-400">JPG/PNG up to 5MB. Saved to server.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid content-start gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Product Name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          </div>
          <Input label="SKU"     name="sku"     value={form.sku}     onChange={handleChange} />
          <Input label="Barcode" name="barcode" value={form.barcode} onChange={handleChange} />
          <div className="md:col-span-2">
            <Input label="Category" name="category" value={form.category} onChange={handleChange} />
          </div>
          <Input label="Cost Price"    name="cost_price"    type="number" step="0.01" value={form.cost_price}    onChange={handleChange} error={errors.cost_price} />
          <Input label="Selling Price" name="selling_price" type="number" step="0.01" value={form.selling_price} onChange={handleChange} error={errors.selling_price} />
          <Input label="Quantity"      name="quantity"      type="number"             value={form.quantity}      onChange={handleChange} />
          <Input label="Reorder Level" name="reorder_level" type="number"             value={form.reorder_level} onChange={handleChange} />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</Button>
      </div>
    </form>
  );
}
