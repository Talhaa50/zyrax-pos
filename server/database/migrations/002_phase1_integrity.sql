-- Phase 1 integrity hardening.
-- Run after 001_initial_schema.sql in Supabase.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE inventory_logs
  ADD COLUMN IF NOT EXISTS reference_id TEXT,
  ADD COLUMN IF NOT EXISTS reference_type TEXT;

CREATE INDEX IF NOT EXISTS idx_inventory_logs_reference
  ON inventory_logs(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs(actor_id, created_at DESC);

CREATE OR REPLACE FUNCTION apply_sale_atomic(p_sale JSONB, p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id TEXT;
  v_item JSONB;
  v_product RECORD;
  v_quantity INTEGER;
BEGIN
  INSERT INTO sales (id, invoice_number, cashier_id, total, created_at)
  VALUES (
    p_sale->>'id',
    p_sale->>'invoice_number',
    p_sale->>'cashier_id',
    COALESCE((p_sale->>'total')::NUMERIC, 0),
    COALESCE((p_sale->>'created_at')::TIMESTAMPTZ, NOW())
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_sale_id;

  IF v_sale_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'is_duplicate', true);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid sale quantity';
    END IF;

    SELECT id, name, quantity
      INTO v_product
      FROM products
     WHERE id = v_item->>'product_id'
       AND archived = FALSE
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is unavailable', v_item->>'product_id';
    END IF;

    IF v_product.quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %',
        v_product.name, v_product.quantity, v_quantity;
    END IF;

    INSERT INTO sale_items (id, sale_id, product_id, quantity, price, subtotal)
    VALUES (
      v_item->>'id',
      p_sale->>'id',
      v_item->>'product_id',
      v_quantity,
      COALESCE((v_item->>'price')::NUMERIC, 0),
      COALESCE((v_item->>'subtotal')::NUMERIC, 0)
    );

    UPDATE products
       SET quantity = quantity - v_quantity,
           updated_at = NOW()
     WHERE id = v_product.id;

    INSERT INTO inventory_logs (
      id, product_id, type, quantity, reference_id, reference_type, created_at
    )
    VALUES (
      'sale_' || (p_sale->>'id') || '_' || (v_item->>'product_id'),
      v_product.id,
      'SALE',
      -v_quantity,
      p_sale->>'id',
      'sale',
      COALESCE((p_sale->>'created_at')::TIMESTAMPTZ, NOW())
    );
  END LOOP;

  INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata, created_at)
  VALUES (
    'sale_' || (p_sale->>'id'),
    'CREATE_SALE',
    'sale',
    p_sale->>'id',
    p_sale->>'cashier_id',
    jsonb_build_object(
      'invoice_number', p_sale->>'invoice_number',
      'total', p_sale->>'total',
      'item_count', jsonb_array_length(p_items)
    ),
    COALESCE((p_sale->>'created_at')::TIMESTAMPTZ, NOW())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'is_duplicate', false, 'sale_id', v_sale_id);
END;
$$;
