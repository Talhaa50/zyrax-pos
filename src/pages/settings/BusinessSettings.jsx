import { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';

export default function BusinessSettings() {
  const { settings, saveSettings, loading } = useBusinessSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Update form when settings load
  useState(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const result = await saveSettings(form);

    if (result.success) {
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(`Failed to save: ${result.error}`);
    }

    setSaving(false);
  };

  if (loading && !form.business_name) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h2 className="mb-6">Business Settings</h2>
      <form onSubmit={handleSave}>
        <div className="rounded-xl border p-6">
          <div className="space-y-4">
            <Input 
              label="Business Name" 
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              required
            />
            <Input 
              label="Currency" 
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              placeholder="PKR"
              maxLength={3}
              required
            />
            <Input 
              label="Tax Rate (%)" 
              type="number"
              step="0.01"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Receipt Footer</label>
              <textarea
                value={form.receipt_footer}
                onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                className="w-full rounded-xl border px-4 py-2"
                rows={3}
              />
            </div>
            <Input 
              label="Low Stock Threshold" 
              type="number"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
            />
            
            {message && (
              <div className={`rounded-xl px-4 py-2 text-sm ${
                message.includes('success') 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
