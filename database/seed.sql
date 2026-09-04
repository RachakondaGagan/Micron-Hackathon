-- ============================================================
-- ProcureAI — Seed / Demo Data
-- ============================================================
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================
-- Supports 4 demo scenarios:
--   1. Duplicate detection (MAT-001 at PLT-01 has recent historical PR)
--   2. Sufficient inventory → APPROVE (MAT-005 at PLT-01)
--   3. Insufficient inventory → Agent 2 vendor ranking (MAT-002 at PLT-01)
--   4. Duplicate + insufficient → REVIEW/REJECT (MAT-003 at PLT-01)
-- ============================================================
-- ============================================================
-- 1. Materials (6)
-- ============================================================
INSERT INTO material_master (
    material_id,
    material_name,
    description,
    material_group,
    unit_of_measure
  )
VALUES (
    'MAT-001',
    'Industrial Pump Seals',
    'High-grade mechanical seals for industrial water pumps. Compatible with centrifugal and positive displacement models.',
    'SPARE_PART',
    'EA'
  ),
  (
    'MAT-002',
    'Hydraulic Fluid ISO 46',
    'Premium anti-wear hydraulic fluid meeting ISO 46 viscosity grade. Suitable for high-pressure hydraulic systems.',
    'CONSUMABLE',
    'LTR'
  ),
  (
    'MAT-003',
    'Steel Pipe 2-inch Schedule 40',
    'Carbon steel seamless pipe, 2-inch nominal diameter, Schedule 40 wall thickness. ASTM A106 Grade B.',
    'RAW_MATERIAL',
    'MTR'
  ),
  (
    'MAT-004',
    'Control Valve DN50 PN16',
    'Globe-type pneumatic control valve, DN50, PN16 pressure rating. 4-20mA signal input with positioner.',
    'EQUIPMENT',
    'EA'
  ),
  (
    'MAT-005',
    'Safety Gloves - Chemical Resistant',
    'Nitrile chemical-resistant safety gloves, EN 374 certified. Pack of 12 pairs.',
    'CONSUMABLE',
    'PKG'
  ),
  (
    'MAT-006',
    'Bearing Assembly 6205-2RS',
    'Deep groove ball bearing, sealed (2RS), 25mm bore. Suitable for electric motors and conveyors.',
    'SPARE_PART',
    'EA'
  );
-- ============================================================
-- 2. Plants (3)
-- ============================================================
INSERT INTO plant_master (plant_id, plant_name, location)
VALUES ('PLT-01', 'North Plant', 'Chicago, Illinois'),
  ('PLT-02', 'South Plant', 'Houston, Texas'),
  ('PLT-03', 'East Plant', 'Newark, New Jersey');
-- ============================================================
-- 3. Plant-Material Mappings
-- All 6 materials mapped to PLT-01 and PLT-02
-- MAT-001, MAT-003, MAT-006 also mapped to PLT-03
-- ============================================================
INSERT INTO plant_material_mapping (plant_id, material_id, is_required, is_active)
VALUES -- PLT-01: all materials
  ('PLT-01', 'MAT-001', TRUE, TRUE),
  ('PLT-01', 'MAT-002', TRUE, TRUE),
  ('PLT-01', 'MAT-003', TRUE, TRUE),
  ('PLT-01', 'MAT-004', FALSE, TRUE),
  ('PLT-01', 'MAT-005', FALSE, TRUE),
  ('PLT-01', 'MAT-006', TRUE, TRUE),
  -- PLT-02: all materials
  ('PLT-02', 'MAT-001', TRUE, TRUE),
  ('PLT-02', 'MAT-002', TRUE, TRUE),
  ('PLT-02', 'MAT-003', FALSE, TRUE),
  ('PLT-02', 'MAT-004', FALSE, TRUE),
  ('PLT-02', 'MAT-005', FALSE, TRUE),
  ('PLT-02', 'MAT-006', FALSE, TRUE),
  -- PLT-03: selected materials
  ('PLT-03', 'MAT-001', FALSE, TRUE),
  ('PLT-03', 'MAT-003', TRUE, TRUE),
  ('PLT-03', 'MAT-006', FALSE, TRUE);
-- ============================================================
-- 4. Vendors (10 vendor-material combinations)
-- ============================================================
-- Vendors for MAT-001 (Industrial Pump Seals) — 2 vendors
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location
  )
VALUES (
    'VND-001',
    'Precision Seal Co.',
    'MAT-001',
    45.00,
    7,
    4.5,
    95.0,
    'Chicago, Illinois'
  ),
  (
    'VND-002',
    'Global Sealing Solutions',
    'MAT-001',
    52.00,
    12,
    4.2,
    88.0,
    'Detroit, Michigan'
  );
-- Vendors for MAT-002 (Hydraulic Fluid) — 3 vendors
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location
  )
VALUES (
    'VND-003',
    'LubeMax Industries',
    'MAT-002',
    8.50,
    5,
    4.0,
    92.0,
    'Houston, Texas'
  ),
  (
    'VND-004',
    'FluidTech Supply',
    'MAT-002',
    9.20,
    3,
    4.8,
    97.0,
    'Chicago, Illinois'
  ),
  (
    'VND-005',
    'PetroLube Corp.',
    'MAT-002',
    7.80,
    8,
    3.5,
    85.0,
    'Dallas, Texas'
  );
-- Vendors for MAT-003 (Steel Pipe) — 2 vendors
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location
  )
VALUES (
    'VND-006',
    'SteelWorks America',
    'MAT-003',
    32.00,
    10,
    4.3,
    90.0,
    'Gary, Indiana'
  ),
  (
    'VND-007',
    'PipeSource National',
    'MAT-003',
    28.50,
    14,
    3.9,
    82.0,
    'Birmingham, Alabama'
  );
-- Vendors for MAT-004 (Control Valve) — 1 vendor (sole source)
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location
  )
VALUES (
    'VND-008',
    'ValveTech Automation',
    'MAT-004',
    1250.00,
    21,
    4.7,
    94.0,
    'Milwaukee, Wisconsin'
  );
-- Vendors for MAT-006 (Bearing Assembly) — 2 vendors
INSERT INTO vendor_master (
    vendor_id,
    vendor_name,
    material_id,
    unit_price,
    lead_time_days,
    quality_rating,
    on_time_delivery,
    location
  )
VALUES (
    'VND-009',
    'BearingWorld Inc.',
    'MAT-006',
    18.50,
    4,
    4.1,
    96.0,
    'Cleveland, Ohio'
  ),
  (
    'VND-010',
    'RotorParts Supply',
    'MAT-006',
    21.00,
    6,
    4.6,
    91.0,
    'Newark, New Jersey'
  );
-- Note: MAT-005 (Safety Gloves) has NO vendors intentionally
-- This tests the "no vendors found" edge case
-- ============================================================
-- 5. Inventory
-- ============================================================
-- Scenario-specific inventory levels:
-- MAT-001 at PLT-01: SUFFICIENT scenario
-- available=500, safety=100, forecast will be ~100 → usable=400
-- PR of 200 → remaining=200, well above safety=100 → SUFFICIENT
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-001', 'PLT-01', 500.000, 100.000, 800.000);
-- MAT-002 at PLT-01: INSUFFICIENT scenario
-- available=80, safety=150, forecast=30 → usable=50
-- PR of 100 → remaining=-50, below 0 → INSUFFICIENT
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-002', 'PLT-01', 80.000, 150.000, 500.000);
-- MAT-003 at PLT-01: AT_RISK scenario
-- available=300, safety=250, forecast=50 → usable=250
-- PR of 150 → remaining=100, above 0 but below safety=250 → AT_RISK
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-003', 'PLT-01', 300.000, 250.000, 600.000);
-- MAT-004 at PLT-01: INSUFFICIENT (low stock, high value item)
-- available=2, safety=3, forecast=1 → usable=1
-- PR of 1 → remaining=0, above 0 but below safety=3 → AT_RISK
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-004', 'PLT-01', 2.000, 3.000, 10.000);
-- MAT-005 at PLT-01: SUFFICIENT (consumables well stocked)
-- available=200, safety=30, forecast=20 → usable=180
-- PR of 50 → remaining=130, well above safety=30 → SUFFICIENT
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-005', 'PLT-01', 200.000, 30.000, 400.000);
-- MAT-006 at PLT-01: INSUFFICIENT
-- available=15, safety=20, forecast=10 → usable=5
-- PR of 25 → remaining=-20, below 0 → INSUFFICIENT
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-006', 'PLT-01', 15.000, 20.000, 100.000);
-- PLT-02 inventory (lower stock levels)
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-001', 'PLT-02', 250.000, 80.000, 500.000),
  ('MAT-002', 'PLT-02', 120.000, 100.000, 400.000),
  ('MAT-003', 'PLT-02', 150.000, 100.000, 400.000),
  ('MAT-004', 'PLT-02', 5.000, 2.000, 10.000),
  ('MAT-005', 'PLT-02', 300.000, 50.000, 600.000),
  ('MAT-006', 'PLT-02', 40.000, 15.000, 80.000);
-- PLT-03 inventory (selected materials only)
INSERT INTO inventory (
    material_id,
    plant_id,
    available_stock,
    safety_stock,
    maximum_stock
  )
VALUES ('MAT-001', 'PLT-03', 100.000, 50.000, 300.000),
  ('MAT-003', 'PLT-03', 200.000, 120.000, 500.000),
  ('MAT-006', 'PLT-03', 30.000, 10.000, 60.000);
-- ============================================================
-- 6. Demand Forecasts (next 2 months)
-- ============================================================
-- Use first-of-month dates for the next 2 months from deployment
-- Using 2026-10-01 and 2026-11-01 as the forecast periods
-- PLT-01 forecasts
INSERT INTO demand_forecast (
    material_id,
    plant_id,
    forecast_period,
    forecast_quantity
  )
VALUES ('MAT-001', 'PLT-01', '2026-10-01', 100.000),
  ('MAT-001', 'PLT-01', '2026-11-01', 120.000),
  ('MAT-002', 'PLT-01', '2026-10-01', 30.000),
  ('MAT-002', 'PLT-01', '2026-11-01', 35.000),
  ('MAT-003', 'PLT-01', '2026-10-01', 50.000),
  ('MAT-003', 'PLT-01', '2026-11-01', 60.000),
  ('MAT-004', 'PLT-01', '2026-10-01', 1.000),
  ('MAT-004', 'PLT-01', '2026-11-01', 1.000),
  ('MAT-005', 'PLT-01', '2026-10-01', 20.000),
  ('MAT-005', 'PLT-01', '2026-11-01', 25.000),
  ('MAT-006', 'PLT-01', '2026-10-01', 10.000),
  ('MAT-006', 'PLT-01', '2026-11-01', 12.000);
-- PLT-02 forecasts
INSERT INTO demand_forecast (
    material_id,
    plant_id,
    forecast_period,
    forecast_quantity
  )
VALUES ('MAT-001', 'PLT-02', '2026-10-01', 80.000),
  ('MAT-001', 'PLT-02', '2026-11-01', 90.000),
  ('MAT-002', 'PLT-02', '2026-10-01', 40.000),
  ('MAT-002', 'PLT-02', '2026-11-01', 45.000),
  ('MAT-003', 'PLT-02', '2026-10-01', 30.000),
  ('MAT-003', 'PLT-02', '2026-11-01', 35.000),
  ('MAT-004', 'PLT-02', '2026-10-01', 1.000),
  ('MAT-004', 'PLT-02', '2026-11-01', 2.000),
  ('MAT-005', 'PLT-02', '2026-10-01', 30.000),
  ('MAT-005', 'PLT-02', '2026-11-01', 30.000),
  ('MAT-006', 'PLT-02', '2026-10-01', 8.000),
  ('MAT-006', 'PLT-02', '2026-11-01', 10.000);
-- PLT-03 forecasts
INSERT INTO demand_forecast (
    material_id,
    plant_id,
    forecast_period,
    forecast_quantity
  )
VALUES ('MAT-001', 'PLT-03', '2026-10-01', 40.000),
  ('MAT-001', 'PLT-03', '2026-11-01', 45.000),
  ('MAT-003', 'PLT-03', '2026-10-01', 60.000),
  ('MAT-003', 'PLT-03', '2026-11-01', 70.000),
  ('MAT-006', 'PLT-03', '2026-10-01', 5.000),
  ('MAT-006', 'PLT-03', '2026-11-01', 8.000);
-- ============================================================
-- 7. Historical Purchase Requisitions (for duplicate detection)
-- ============================================================
-- These PRs exist in the last 7 days to trigger Agent 1 scenarios
-- Scenario 1 trigger: recent PR for MAT-001 at PLT-01 (2 days ago)
-- When a new PR for MAT-001/PLT-01 is created, Agent 1 should detect high similarity
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
    'Rahul Sharma',
    'rahul.sharma@procureai.demo',
    'APPROVED',
    NOW() - INTERVAL '2 days'
  );
-- Scenario 4 trigger: recent PR for MAT-003 at PLT-01 (1 day ago)
-- Combined with AT_RISK inventory, should trigger REVIEW
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
    'Priya Patel',
    'priya.patel@procureai.demo',
    'CREATED',
    NOW() - INTERVAL '1 day'
  );
-- Additional historical PRs for variety
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
    'Amit Kumar',
    'amit.kumar@procureai.demo',
    'COMPLETED',
    NOW() - INTERVAL '5 days'
  ),
  (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'PR-2026-00004',
    'MAT-006',
    'PLT-01',
    30.000,
    '2026-09-22',
    'Sneha Reddy',
    'sneha.reddy@procureai.demo',
    'UNDER_REVIEW',
    NOW() - INTERVAL '3 days'
  );
-- ============================================================
-- 8. Verification Queries
-- ============================================================
-- Run these after seeding to verify data:
--
-- SELECT COUNT(*) as materials FROM material_master;        -- Expected: 6
-- SELECT COUNT(*) as plants FROM plant_master;              -- Expected: 3
-- SELECT COUNT(*) as mappings FROM plant_material_mapping;  -- Expected: 15
-- SELECT COUNT(*) as vendors FROM vendor_master;            -- Expected: 10
-- SELECT COUNT(*) as inventory_rows FROM inventory;         -- Expected: 15
-- SELECT COUNT(*) as forecasts FROM demand_forecast;        -- Expected: 30
-- SELECT COUNT(*) as prs FROM purchase_requisitions;        -- Expected: 4
--
-- Inventory scenario verification:
-- SELECT m.material_name, i.available_stock, i.safety_stock,
--        df.forecast_quantity as forecast,
--        (i.available_stock - COALESCE(df.forecast_quantity, 0)) as usable_stock
-- FROM inventory i
-- JOIN material_master m ON i.material_id = m.material_id
-- LEFT JOIN demand_forecast df ON i.material_id = df.material_id
--   AND i.plant_id = df.plant_id
--   AND df.forecast_period = (
--     SELECT MIN(forecast_period) FROM demand_forecast
--     WHERE material_id = i.material_id AND plant_id = i.plant_id
--     AND forecast_period >= CURRENT_DATE
--   )
-- WHERE i.plant_id = 'PLT-01'
-- ORDER BY m.material_id;