-- Synthetic demo data for The Atelier POS.
-- Loaded by `npm run db:seed` (scripts/seed.ts) against any PostgreSQL instance.
-- Idempotent: products / inventory / shop settings are refreshed on conflict;
-- transactions and recipe history are inserted only once.

-----------------------------------------------------------
-- 1. Staff / Users
-----------------------------------------------------------
INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Julian V.', 'julian@theatelier.com', true, 'admin', NOW() - INTERVAL '30 days', NOW()),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Elena M.', 'elena@theatelier.com', true, 'barista', NOW() - INTERVAL '15 days', NOW()),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Sasha M.', 'sasha@theatelier.com', true, 'barista', NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-----------------------------------------------------------
-- 2. Shop settings (singleton row used by receipts & POS)
-----------------------------------------------------------
INSERT INTO "shop_settings" (id, shop_name, address, phone, receipt_footer, currency, tax_enabled, tax_rate_percent)
VALUES (
  'default',
  'The Atelier',
  'Jl. Kemang Raya No. 12, Jakarta Selatan',
  '+62 812-3456-7890',
  'Terima kasih sudah berkunjung!',
  'IDR',
  false,
  0
)
ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  receipt_footer = EXCLUDED.receipt_footer,
  currency = EXCLUDED.currency,
  updated_at = NOW();

-----------------------------------------------------------
-- 3. Raw materials
-----------------------------------------------------------
INSERT INTO "products" (id, name, description, price, category, type, image_url, created_at)
VALUES
  ('b1b2c3d4-0000-0000-0000-000000000010', 'Robusta Beans (1kg)', 'Robusta pilihan untuk espresso signature.', 120000, 'Beans', 'raw_material', '/images/ethiopian.jpg', NOW() - INTERVAL '30 days'),
  ('b1b2c3d4-0000-0000-0000-000000000011', 'Fresh Milk (1L)', 'Susu murni pasteurisasi.', 18000, 'Dairy', 'raw_material', NULL, NOW() - INTERVAL '30 days'),
  ('b1b2c3d4-0000-0000-0000-000000000012', 'Gula Aren Syrup (1L)', 'Sirup gula aren asli Nusantara.', 35000, 'Syrup', 'raw_material', NULL, NOW() - INTERVAL '30 days'),
  ('b1b2c3d4-0000-0000-0000-000000000013', 'Vanilla Syrup (1L)', 'Ekstrak vanilla premium.', 55000, 'Syrup', 'raw_material', NULL, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url;

-----------------------------------------------------------
-- 4. Retail products
-----------------------------------------------------------
INSERT INTO "products" (id, name, description, price, category, type, image_url, created_at)
VALUES
  ('b1b2c3d4-0000-0000-0000-000000000020', 'Butter Croissant', 'Croissant mentega yang dipanggang setiap hari.', 25000, 'Pastry', 'retail', '/images/croissant.jpg', NOW() - INTERVAL '20 days'),
  ('b1b2c3d4-0000-0000-0000-000000000021', 'Atelier Mug', 'Mug keramik eksklusif berlogo The Atelier.', 150000, 'Merchandise', 'retail', '/images/mug.jpg', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url;

-----------------------------------------------------------
-- 5. Menu items
-----------------------------------------------------------
INSERT INTO "products" (id, name, description, price, category, type, image_url, created_at)
VALUES
  ('b1b2c3d4-0000-0000-0000-000000000030', 'Kopi Susu Gula Aren', 'Perpaduan kopi robusta pilihan dengan gula aren asli.', 28000, 'Coffee', 'menu', '/images/oat-latte.jpg', NOW() - INTERVAL '15 days'),
  ('b1b2c3d4-0000-0000-0000-000000000031', 'Coffee Latte', 'Espresso shot dengan steamed milk lembut.', 32000, 'Coffee', 'menu', '/images/latte.png', NOW() - INTERVAL '15 days'),
  ('b1b2c3d4-0000-0000-0000-000000000032', 'Vanilla Latte', 'Latte klasik dengan sentuhan vanilla premium.', 35000, 'Coffee', 'menu', '/images/flat-white.png', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url;

-----------------------------------------------------------
-- 6. Inventory (raw materials & retail)
-----------------------------------------------------------
INSERT INTO "inventory" (id, product_id, current_stock, unit, supplier, status, last_restocked)
VALUES
  ('c1b2c3d4-0000-0000-0000-000000000010', 'b1b2c3d4-0000-0000-0000-000000000010', 50, 'kg', 'Roastery Lokal', 'in_stock', NOW()),
  ('c1b2c3d4-0000-0000-0000-000000000011', 'b1b2c3d4-0000-0000-0000-000000000011', 20, 'liter', 'Peternakan Segar', 'in_stock', NOW()),
  ('c1b2c3d4-0000-0000-0000-000000000012', 'b1b2c3d4-0000-0000-0000-000000000012', 3, 'liter', 'Suplier Sirup', 'low_stock', NOW() - INTERVAL '5 days'),
  ('c1b2c3d4-0000-0000-0000-000000000020', 'b1b2c3d4-0000-0000-0000-000000000020', 12, 'pcs', 'Dapur Sendiri', 'in_stock', NOW() - INTERVAL '1 day'),
  ('c1b2c3d4-0000-0000-0000-000000000021', 'b1b2c3d4-0000-0000-0000-000000000021', 0, 'pcs', 'Distributor Merch', 'out_of_stock', NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO UPDATE SET
  current_stock = EXCLUDED.current_stock,
  unit = EXCLUDED.unit,
  supplier = EXCLUDED.supplier,
  status = EXCLUDED.status,
  last_restocked = EXCLUDED.last_restocked;

-----------------------------------------------------------
-- 7. Recipe mappings (menu -> raw materials)
-----------------------------------------------------------
-- Kopi Susu Gula Aren: beans, milk, gula aren
INSERT INTO "recipe_ingredients" (id, menu_product_id, raw_material_id, quantity_needed, unit)
VALUES
  ('d1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000030', 'b1b2c3d4-0000-0000-0000-000000000010', 18, 'gram'),
  ('d1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000030', 'b1b2c3d4-0000-0000-0000-000000000011', 150, 'ml'),
  ('d1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000030', 'b1b2c3d4-0000-0000-0000-000000000012', 20, 'ml')
ON CONFLICT (id) DO NOTHING;

-- Coffee Latte: beans, milk
INSERT INTO "recipe_ingredients" (id, menu_product_id, raw_material_id, quantity_needed, unit)
VALUES
  ('d1b2c3d4-0000-0000-0000-000000000004', 'b1b2c3d4-0000-0000-0000-000000000031', 'b1b2c3d4-0000-0000-0000-000000000010', 18, 'gram'),
  ('d1b2c3d4-0000-0000-0000-000000000005', 'b1b2c3d4-0000-0000-0000-000000000031', 'b1b2c3d4-0000-0000-0000-000000000011', 200, 'ml')
ON CONFLICT (id) DO NOTHING;

-----------------------------------------------------------
-- 8. Transactions (historical data spread over the last 6 days)
-----------------------------------------------------------
INSERT INTO "transactions" (id, cashier_id, subtotal, tax_amount, discount_amount, paid_amount, change_amount, total_amount, payment_method, status, customer_name, table_number, created_at)
VALUES
  ('e1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 81000, 0, 0, 81000, 0, 81000, 'card', 'completed', 'Budi Santoso', 'T1', NOW() - INTERVAL '1 day'),
  ('e1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000003', 28000, 0, 0, 50000, 22000, 28000, 'cash', 'completed', NULL, 'Takeaway', NOW() - INTERVAL '2 days'),
  ('e1b2c3d4-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 57000, 0, 0, 57000, 0, 57000, 'qr_code', 'completed', 'Siti Rahma', 'T4', NOW() - INTERVAL '3 days'),
  ('e1b2c3d4-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000002', 113000, 0, 0, 113000, 0, 113000, 'card', 'completed', 'Andi Wijaya', 'T2', NOW() - INTERVAL '4 days'),
  ('e1b2c3d4-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000003', 32000, 0, 0, 50000, 18000, 32000, 'cash', 'completed', NULL, 'Takeaway', NOW() - INTERVAL '5 days'),
  ('e1b2c3d4-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 56000, 0, 0, 56000, 0, 56000, 'card', 'completed', 'Dewi Lestari', 'T3', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-----------------------------------------------------------
-- 9. Transaction items
-----------------------------------------------------------
INSERT INTO "transaction_items" (id, transaction_id, product_id, quantity, price_at_time)
VALUES
  -- Trans 1: 2x Kopi Susu (56.000) + 1x Croissant (25.000) = 81.000
  ('f1b2c3d4-0000-0000-0000-000000000001', 'e1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000030', 2, 28000),
  ('f1b2c3d4-0000-0000-0000-000000000002', 'e1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000020', 1, 25000),
  -- Trans 2: 1x Kopi Susu (28.000)
  ('f1b2c3d4-0000-0000-0000-000000000003', 'e1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000030', 1, 28000),
  -- Trans 3: 1x Coffee Latte (32.000) + 1x Croissant (25.000) = 57.000
  ('f1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000031', 1, 32000),
  ('f1b2c3d4-0000-0000-0000-000000000005', 'e1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000020', 1, 25000),
  -- Trans 4: 2x Kopi Susu (56.000) + 1x Coffee Latte (32.000) + 1x Croissant (25.000) = 113.000
  ('f1b2c3d4-0000-0000-0000-000000000006', 'e1b2c3d4-0000-0000-0000-000000000004', 'b1b2c3d4-0000-0000-0000-000000000030', 2, 28000),
  ('f1b2c3d4-0000-0000-0000-000000000007', 'e1b2c3d4-0000-0000-0000-000000000004', 'b1b2c3d4-0000-0000-0000-000000000031', 1, 32000),
  ('f1b2c3d4-0000-0000-0000-000000000008', 'e1b2c3d4-0000-0000-0000-000000000004', 'b1b2c3d4-0000-0000-0000-000000000020', 1, 25000),
  -- Trans 5: 1x Coffee Latte (32.000)
  ('f1b2c3d4-0000-0000-0000-000000000009', 'e1b2c3d4-0000-0000-0000-000000000005', 'b1b2c3d4-0000-0000-0000-000000000031', 1, 32000),
  -- Trans 6: 2x Kopi Susu (56.000)
  ('f1b2c3d4-0000-0000-0000-000000000010', 'e1b2c3d4-0000-0000-0000-000000000006', 'b1b2c3d4-0000-0000-0000-000000000030', 2, 28000)
ON CONFLICT (id) DO NOTHING;
