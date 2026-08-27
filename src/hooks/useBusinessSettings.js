import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services/api/settingsApi';

export function useBusinessSettings() {
  const [settings, setSettings] = useState({
    business_name: 'MTC Decoration',
    currency: 'PKR',
    tax_rate: 10,
    receipt_footer: 'Thank you for shopping with us!',
    low_stock_threshold: 10,
    preset: 'classic-blue',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('[Settings] Failed to fetch settings:', err);
      setError(err.message);
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to API
  const saveSettings = useCallback(async (newSettings) => {
    try {
      setLoading(true);
      const updated = await settingsApi.updateSettings(newSettings);
      setSettings(updated);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value}%`;
  };

  return {
    settings,
    currency: settings.currency,
    taxRate: settings.tax_rate,
    businessName: settings.business_name,
    receiptFooter: settings.receipt_footer,
    lowStockThreshold: settings.low_stock_threshold,
    preset: settings.preset,
    formatMoney,
    formatPercent,
    saveSettings,
    refreshSettings: fetchSettings,
    loading,
    error,
    ready: !loading,
  };
}
