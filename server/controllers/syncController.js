import { applySyncAction } from '../services/syncService.js';

const CASHIER_ACTIONS = new Set(['CREATE_SALE']);
const ADMIN_ACTIONS = new Set([
  'CREATE_PRODUCT',
  'UPDATE_PRODUCT',
  'ARCHIVE_PRODUCT',
  'INVENTORY_ADJUST',
  'CREATE_SALE',
]);
const MAX_PAYLOAD_BYTES = 512 * 1024;

export async function handleSync(req, res) {
  try {
    const item = req.body;
    if (!item || typeof item !== 'object' || !item.action || !item.id) {
      return res.status(400).json({ message: 'Invalid sync payload' });
    }

    const payloadSize = Buffer.byteLength(JSON.stringify(item), 'utf8');
    if (payloadSize > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({ message: 'Sync payload is too large' });
    }

    const allowed = req.user?.role === 'admin' ? ADMIN_ACTIONS : CASHIER_ACTIONS;
    if (!allowed.has(item.action)) {
      return res.status(403).json({ message: 'You are not allowed to sync this action' });
    }

    if (item.action === 'CREATE_SALE') {
      const sale = item.payload?.sale;
      if (!sale?.id || !Array.isArray(item.payload.items) || item.payload.items.length === 0) {
        return res.status(400).json({ message: 'Invalid sale payload' });
      }

      // Offline users can have a device-local ID. Once they authenticate
      // online, reconcile that local identity to the signed server identity
      // using the immutable email captured at checkout.
      const emailMatches = sale.cashier_email && sale.cashier_email.toLowerCase() === req.user.email.toLowerCase();
      const idMatches = sale.cashier_id && sale.cashier_id === req.user.id;
      if (!emailMatches && !idMatches) {
        return res.status(403).json({ message: 'Sale cashier does not match authenticated user' });
      }

      item.payload.sale = { ...sale, cashier_id: req.user.id, cashier_email: req.user.email };
    }

    const result = await applySyncAction(item);
    return res.json({ success: true, id: item.id, result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
