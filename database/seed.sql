-- ============================================================
-- Micron ProcureAI — Real-World Semiconductor Master Seed Data
-- ============================================================
-- Micron Technology Manufacturing Operations & Cleanroom SCM
-- Real-world Fabs (Boise, Hiroshima, Singapore, Taichung, Gujarat)
-- Semiconductor Materials (300mm Wafers, EUV Resists, Slurry, IPA, Wire, Underfill)
-- Tier-1 Suppliers (Shin-Etsu, SUMCO, TOK, JSR, Entegris, Tanaka, Namics)
-- ============================================================

-- Clean existing data in reverse FK order
TRUNCATE TABLE ai_pr_analysis CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE purchase_requisitions CASCADE;
TRUNCATE TABLE demand_forecast CASCADE;
TRUNCATE TABLE inventory CASCADE;
TRUNCATE TABLE vendor_master CASCADE;
TRUNCATE TABLE plant_material_mapping CASCADE;
TRUNCATE TABLE plant_master CASCADE;
TRUNCATE TABLE material_master CASCADE;

-- ============================================================
-- 1. Real Micron Semiconductor Materials
-- ============================================================
INSERT INTO material_master (
    material_id,
    material_name,
    description,
    material_group,
    unit_of_measure,
    is_active
  )
VALUES (
    'MAT-001',
    '300mm Prime Silicon Wafers (P-Type <100>)',
    'Ultra-flat prime-grade 300mm single-crystal silicon substrate for high-density 1-beta DRAM and advanced 3D NAND wafer fabrication.',
    'RAW_MATERIAL',
    'WAF',
    TRUE
  ),
  (
    'MAT-002',
    'EUV / ArFi Photoresist Formulation',
    'Extreme Ultraviolet (EUV) and Argon Fluoride immersion lithography photoresist for sub-10nm memory bitlines and vertical gate patterning.',
    'CONSUMABLE',
    'LTR',
    TRUE
  ),
  (
    'MAT-003',
    'Ultra-Pure Electronic Grade IPA (99.999%)',
    'Semiconductor-grade ultra-pure isopropyl alcohol for critical wafer post-etch cleaning, particulate rinse, and cleanroom solvent baths.',
    'CONSUMABLE',
    'LTR',
    TRUE
  ),
  (
    'MAT-004',
    'High-Selectivity Ceria CMP Slurry',
    'Chemical-Mechanical Planarization polishing slurry engineered with ceria nanoparticles for 3D NAND vertical oxide-nitride stack planarization.',
    'CONSUMABLE',
    'DRM',
    TRUE
  ),
  (
    'MAT-005',
    'Class 1 Cleanroom ESD Protective Suits',
    'Particle-free, static-dissipative cleanroom barrier coveralls for fab technicians operating inside ISO Class 1 semiconductor cleanrooms.',
    'CONSUMABLE',
    'PKG',
    TRUE
  ),
  (
    'MAT-006',
    'High-Purity Copper/Gold Wire (0.8 mil)',
    'Semiconductor-grade ultra-fine micro bonding wire for memory die interconnections at Micron ATMP assembly and packaging cleanrooms.',
    'RAW_MATERIAL',
    'SPL',
    TRUE
  ),
  (
    'MAT-007',
    'Capillary Underfill Resin for HBM3E',
    'High thermal conductivity epoxy underfill polymer designed for High Bandwidth Memory (HBM3E / HBM4) 8-Hi and 12-Hi multi-die 3D stacking.',
    'RAW_MATERIAL',
    'KG',
    TRUE
  );

-- ============================================================
-- 2. Real Micron Manufacturing Plants & Fabs
-- ============================================================
INSERT INTO plant_master (plant_id, plant_name, location, is_active)
VALUES 
  ('PLT-01', 'Fab 4 / Technology Center', 'Boise, Idaho, USA', TRUE),
  ('PLT-02', 'Fab 15 (Hiroshima Fab)', 'Hiroshima, Japan', TRUE),
  ('PLT-03', 'Fab 10 (Singapore Mega-Fab)', 'Woodlands, Singapore', TRUE),
  ('PLT-04', 'Fab 11 (Taichung Fab)', 'Taichung, Taiwan', TRUE),
  ('PLT-05', 'Sanand ATMP Facility', 'Gujarat, India', TRUE);

-- ============================================================
-- 3. Plant-Material Mappings
-- ============================================================
INSERT INTO plant_material_mapping (plant_id, material_id, is_required, is_active)
VALUES 
  -- PLT-01: Fab 4 (Boise R&D / DRAM Pilot)
  ('PLT-01', 'MAT-001', TRUE, TRUE),
  ('PLT-01', 'MAT-002', TRUE, TRUE),
  ('PLT-01', 'MAT-003', TRUE, TRUE),
  ('PLT-01', 'MAT-004', TRUE, TRUE),
  ('PLT-01', 'MAT-005', TRUE, TRUE),
  ('PLT-01', 'MAT-006', FALSE, TRUE),
  ('PLT-01', 'MAT-007', TRUE, TRUE),

  -- PLT-02: Fab 15 (Hiroshima DRAM Fab)
  ('PLT-02', 'MAT-001', TRUE, TRUE),
  ('PLT-02', 'MAT-002', TRUE, TRUE),
  ('PLT-02', 'MAT-003', TRUE, TRUE),
  ('PLT-02', 'MAT-004', TRUE, TRUE),
  ('PLT-02', 'MAT-005', TRUE, TRUE),

  -- PLT-03: Fab 10 (Singapore 3D NAND Mega-Fab)
  ('PLT-03', 'MAT-001', TRUE, TRUE),
  ('PLT-03', 'MAT-003', TRUE, TRUE),
  ('PLT-03', 'MAT-004', TRUE, TRUE),
  ('PLT-03', 'MAT-005', TRUE, TRUE),

  -- PLT-04: Fab 11 (Taichung DRAM Fab)
  ('PLT-04', 'MAT-001', TRUE, TRUE),
  ('PLT-04', 'MAT-002', TRUE, TRUE),
  ('PLT-04', 'MAT-003', TRUE, TRUE),

  -- PLT-05: Sanand ATMP Facility (Gujarat Packaging & Test)
  ('PLT-05', 'MAT-005', TRUE, TRUE),
  ('PLT-05', 'MAT-006', TRUE, TRUE),
  ('PLT-05', 'MAT-007', TRUE, TRUE);

-- ============================================================
-- 4. Real Semiconductor Suppliers & Vendors
-- ============================================================
-- Suppliers for MAT-001 (300mm Silicon Wafers)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location,
    is_active
  )
VALUES (
    'VND-001',
    'Shin-Etsu Handotai (SEH)',
    'MAT-001',
    185.00,
    12,
    4.9,
    98.5,
    'Tokyo, Japan',
    TRUE
  ),
  (
    'VND-002',
    'SUMCO Corporation',
    'MAT-001',
    192.00,
    14,
    4.8,
    96.0,
    'Tokyo, Japan',
    TRUE
  ),
  (
    'VND-003',
    'GlobalWafers Co., Ltd.',
    'MAT-001',
    178.00,
    16,
    4.6,
    94.0,
    'Hsinchu, Taiwan',
    TRUE
  );

-- Suppliers for MAT-002 (EUV / ArFi Photoresist)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location,
    is_active
  )
VALUES (
    'VND-004',
    'Tokyo Ohka Kogyo (TOK)',
    'MAT-002',
    1450.00,
    7,
    4.9,
    97.5,
    'Kawasaki, Japan',
    TRUE
  ),
  (
    'VND-005',
    'JSR Corporation',
    'MAT-002',
    1520.00,
    9,
    4.8,
    96.0,
    'Tokyo, Japan',
    TRUE
  ),
  (
    'VND-006',
    'DuPont Electronic Solutions',
    'MAT-002',
    1410.00,
    10,
    4.6,
    93.5,
    'Wilmington, Delaware, USA',
    TRUE
  );

-- Suppliers for MAT-003 (Ultra-Pure IPA 99.999%)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location,
    is_active
  )
VALUES (
    'VND-007',
    'Kanto Chemical Co., Inc.',
    'MAT-003',
    28.50,
    5,
    4.7,
    96.0,
    'Tokyo, Japan',
    TRUE
  ),
  (
    'VND-008',
    'Entegris, Inc.',
    'MAT-003',
    31.00,
    6,
    4.8,
    95.0,
    'Billerica, Massachusetts, USA',
    TRUE
  );

-- Suppliers for MAT-004 (High-Selectivity Ceria CMP Slurry)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location,
    is_active
  )
VALUES (
    'VND-009',
    'Cabot Microelectronics / Entegris',
    'MAT-004',
    850.00,
    8,
    4.8,
    95.5,
    'Aurora, Illinois, USA',
    TRUE
  );

-- Suppliers for MAT-006 (Bonding Wire for Packaging)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location,
    is_active
  )
VALUES (
    'VND-010',
    'Tanaka Kikinzoku Kogyo',
    'MAT-006',
    120.00,
    11,
    4.7,
    94.5,
    'Tokyo, Japan',
    TRUE
  );

-- Suppliers for MAT-007 (Capillary Underfill for HBM3E)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location,
    is_active
  )
VALUES (
    'VND-011',
    'Namics Corporation',
    'MAT-007',
    480.00,
    8,
    4.9,
    98.0,
    'Niigata, Japan',
    TRUE
  );

-- Note: MAT-005 (Class 1 Cleanroom Suits) intentionally has NO vendor configured
-- to validate the "no active external vendor / internal warehouse fulfillment" fallback.

-- ============================================================
-- 5. Inventory Setup Supporting 4 Demo Scenarios
-- ============================================================
-- MAT-001 at PLT-01 (Boise): SUFFICIENT baseline (avail=500, safety=100, max=800)
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-001', 'PLT-01', 500.000, 100.000, 800.000);

-- MAT-002 at PLT-01 (Boise): INSUFFICIENT scenario (avail=20, safety=80, max=300)
-- A requisition of 50 triggers Agent 2 vendor competition
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-002', 'PLT-01', 20.000, 80.000, 300.000);

-- MAT-003 at PLT-01 (Boise): AT_RISK scenario (avail=300, safety=250, max=600)
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-003', 'PLT-01', 300.000, 250.000, 600.000);

-- MAT-004 at PLT-01 (Boise): Balanced CMP stock
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-004', 'PLT-01', 15.000, 10.000, 50.000);

-- MAT-005 at PLT-01 (Boise): SUFFICIENT scenario (avail=350, safety=50, max=500)
-- Requisition of 50 triggers automatic approval
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-005', 'PLT-01', 350.000, 50.000, 500.000);

-- MAT-006 at PLT-01 (Boise): Low bonding wire
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-006', 'PLT-01', 25.000, 30.000, 100.000);

-- MAT-007 at PLT-01 (Boise): HBM3E underfill buffer
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES ('MAT-007', 'PLT-01', 60.000, 40.000, 150.000);

-- Inventories for PLT-02 (Hiroshima Fab)
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES 
  ('MAT-001', 'PLT-02', 320.000, 120.000, 600.000),
  ('MAT-002', 'PLT-02', 45.000, 40.000, 150.000),
  ('MAT-003', 'PLT-02', 210.000, 150.000, 500.000),
  ('MAT-004', 'PLT-02', 20.000, 15.000, 60.000),
  ('MAT-005', 'PLT-02', 180.000, 40.000, 300.000);

-- Inventories for PLT-03 (Singapore Mega-Fab)
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES 
  ('MAT-001', 'PLT-03', 450.000, 150.000, 900.000),
  ('MAT-003', 'PLT-03', 380.000, 200.000, 700.000),
  ('MAT-004', 'PLT-03', 35.000, 20.000, 80.000),
  ('MAT-005', 'PLT-03', 250.000, 60.000, 500.000);

-- Inventories for PLT-05 (Sanand ATMP Facility)
INSERT INTO inventory (material_id, plant_id, available_stock, safety_stock, maximum_stock)
VALUES 
  ('MAT-005', 'PLT-05', 200.000, 50.000, 400.000),
  ('MAT-006', 'PLT-05', 85.000, 40.000, 200.000),
  ('MAT-007', 'PLT-05', 90.000, 30.000, 250.000);

-- ============================================================
-- 6. Demand Forecasts (Semiconductor Run-Rates)
-- ============================================================
INSERT INTO demand_forecast (material_id, plant_id, forecast_period, forecast_quantity)
VALUES 
  -- Boise Fab 4
  ('MAT-001', 'PLT-01', '2026-10-01', 120.000),
  ('MAT-001', 'PLT-01', '2026-11-01', 140.000),
  ('MAT-002', 'PLT-01', '2026-10-01', 30.000),
  ('MAT-002', 'PLT-01', '2026-11-01', 35.000),
  ('MAT-003', 'PLT-01', '2026-10-01', 60.000),
  ('MAT-003', 'PLT-01', '2026-11-01', 75.000),
  ('MAT-004', 'PLT-01', '2026-10-01', 5.000),
  ('MAT-004', 'PLT-01', '2026-11-01', 6.000),
  ('MAT-005', 'PLT-01', '2026-10-01', 30.000),
  ('MAT-005', 'PLT-01', '2026-11-01', 35.000),
  ('MAT-006', 'PLT-01', '2026-10-01', 10.000),
  ('MAT-007', 'PLT-01', '2026-10-01', 15.000),

  -- Hiroshima Fab 15
  ('MAT-001', 'PLT-02', '2026-10-01', 90.000),
  ('MAT-002', 'PLT-02', '2026-10-01', 40.000),
  ('MAT-003', 'PLT-02', '2026-10-01', 50.000),

  -- Singapore Fab 10
  ('MAT-001', 'PLT-03', '2026-10-01', 150.000),
  ('MAT-004', 'PLT-03', '2026-10-01', 12.000),

  -- Sanand ATMP
  ('MAT-006', 'PLT-05', '2026-10-01', 25.000),
  ('MAT-007', 'PLT-05', '2026-10-01', 20.000);

-- ============================================================
-- 7. Historical Purchase Requisitions (Triggering Duplicate Rules)
-- ============================================================
-- Scenario 1 trigger: Recent PR for MAT-001 (300mm Wafers) at PLT-01 (Boise) 2 days ago
-- New PR for MAT-001 at PLT-01 triggers high similarity (>75%) duplicate alert
INSERT INTO purchase_requisitions (
    pr_id,
    pr_number,
    material_id,
    plant_id,
    quantity,
    required_date,
    requestor_name,
    requestor_email,
    status,
    created_at
  )
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'PR-2026-00001',
    'MAT-001',
    'PLT-01',
    200.000,
    '2026-09-20',
    'Gagan Rachakonda',
    'gaganrachakonda.work@gmail.com',
    'APPROVED',
    NOW() - INTERVAL '2 days'
  );

-- Scenario 4 trigger: Recent PR for MAT-003 (Ultra-Pure IPA) at PLT-01 (Boise) 1 day ago
-- Combined with AT_RISK inventory, triggers REVIEW
INSERT INTO purchase_requisitions (
    pr_id,
    pr_number,
    material_id,
    plant_id,
    quantity,
    required_date,
    requestor_name,
    requestor_email,
    status,
    created_at
  )
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'PR-2026-00002',
    'MAT-003',
    'PLT-01',
    150.000,
    '2026-09-18',
    'Bhargav Teja',
    'bhargav.teja@micron.demo',
    'CREATED',
    NOW() - INTERVAL '1 day'
  );

-- Additional historical PRs across other Micron facilities
INSERT INTO purchase_requisitions (
    pr_id,
    pr_number,
    material_id,
    plant_id,
    quantity,
    required_date,
    requestor_name,
    requestor_email,
    status,
    created_at
  )
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'PR-2026-00003',
    'MAT-002',
    'PLT-02',
    50.000,
    '2026-09-25',
    'Nikitha Rao',
    'nikitha.rao@micron.demo',
    'COMPLETED',
    NOW() - INTERVAL '5 days'
  ),
  (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'PR-2026-00004',
    'MAT-006',
    'PLT-05',
    30.000,
    '2026-09-22',
    'Ruthvik Reddy',
    'ruthvik.reddy@micron.demo',
    'UNDER_REVIEW',
    NOW() - INTERVAL '3 days'
  );