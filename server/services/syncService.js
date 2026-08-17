import { supabase, isSupabaseConfigured } from '../config/db.js';
import { logger } from '../utils/logger.js';

const memoryStore = {
  products: [],
  sales: [],
  inventory_logs: [],
  sale_items: [],
};

export async function applySyncAction(item) {
  const { action, payload } = item;
  logger('info', 'Applying sync action', { action, id: item.id });

  if (!isSupabaseConfigured()) {
    return applyToMemory(action, payload);
  }

  switch (action) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT':
      return supabase.from('products').upsert(mapProduct(payload));

    case 'ARCHIVE_PRODUCT':
      return supabase.from('products').update({ archived: true, updated_at: new Date().toISOString() }).eq('id', payload.id);

    case 'CREATE_SALE': {
      const { data, error } = await supabase.rpc('apply_sale_atomic', {
        p_sale: mapSale(payload.sale),
        p_items: (payload.items || []).map(mapSaleItem),
      });

      if (error) {
        logger('error', 'Atomic sale sync failed', { id: item.id, error: error.message });
        throw error;
      }
      return data || { ok: true };
    }

    case 'INVENTORY_ADJUST':
      return supabase.from('inventory_logs').upsert(mapInventoryLog(payload));

    default:
      throw new Error(`Unknown sync action: ${action}`);
  }
}

function applyToMemory(action, payload) {
  switch (action) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT': {
      const existing = memoryStore.products.find((p) => p.id === payload.id);
      if (existing) Object.assign(existing, payload);
      else memoryStore.products.push(payload);
      return { ok: true };
    }

    case 'CREATE_SALE': {
      if (memoryStore.sales.some((sale) => sale.id === payload.sale.id)) {
        return { ok: true, is_duplicate: true };
      }

      for (const item of payload.items || []) {
        const product = memoryStore.products.find((p) => p.id === item.product_id);
        if (product && product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      for (const item of payload.items || []) {
        const product = memoryStore.products.find((p) => p.id === item.product_id);
        if (!product) throw new Error(`Product unavailable: ${item.product_id}`);
        product.quantity -= item.quantity;
        memoryStore.sale_items.push(mapSaleItem(item));
        memoryStore.inventory_logs.push(mapInventoryLog({
          id: `sale_${payload.sale.id}_${item.product_id}`,
          product_id: item.product_id,
          type: 'SALE',
          quantity: -item.quantity,
          reference_id: payload.sale.id,
          reference_type: 'sale',
          created_at: payload.sale.created_at,
        }));
      }

      memoryStore.sales.push(payload.sale);
      return { ok: true, is_duplicate: false };
    }

    case 'INVENTORY_ADJUST':
      memoryStore.inventory_logs = memoryStore.inventory_logs.filter((log) => log.id !== payload.id);
      memoryStore.inventory_logs.push(mapInventoryLog(payload));
      return { ok: true };

    default:
      throw new Error(`Unknown sync action: ${action}`);
  }
}

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    category: p.category,
    cost_price: p.cost_price,
    selling_price: p.selling_price,
    quantity: p.quantity,
    reorder_level: p.reorder_level,
    image_id: p.image_id,
    archived: p.archived ?? false,
    created_at: p.created_at,
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

function mapSale(s) {
  return {
    id: s.id,
    invoice_number: s.invoice_number,
    cashier_id: s.cashier_id,
    total: s.total,
    created_at: s.created_at,
  };
}

function mapSaleItem(i) {
  return {
    id: i.id,
    sale_id: i.sale_id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
    subtotal: i.subtotal,
  };
}

function mapInventoryLog(l) {
  return {
    id: l.id || `inv_${Date.now()}_${l.product_id}`,
    product_id: l.product_id,
    type: l.type,
    quantity: l.quantity,
    reference_id: l.reference_id,
    reference_type: l.reference_type,
    created_at: l.created_at || new Date().toISOString(),
  };
}
