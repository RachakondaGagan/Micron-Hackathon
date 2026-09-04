-- ============================================================
-- ProcureAI — Database Schema Migration
-- PostgreSQL / Supabase
-- ============================================================
-- Run this ENTIRE file in Supabase SQL Editor (in one execution)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. material_master
-- ============================================================
CREATE TABLE material_master (
  material_id    VARCHAR(20)   PRIMARY KEY,
  material_name  VARCHAR(200)  NOT NULL,
  description    TEXT,
  material_group VARCHAR(50)   NOT NULL,
  unit_of_measure VARCHAR(10) NOT NULL DEFAULT 'EA',
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE material_master IS 'Master catalog of all procurable materials';
COMMENT ON COLUMN material_master.material_id IS 'Human-readable ID, e.g. MAT-001';
COMMENT ON COLUMN material_master.material_group IS 'Category: RAW_MATERIAL, SPARE_PART, CONSUMABLE, EQUIPMENT';

-- ============================================================
-- 2. plant_master
-- ============================================================
CREATE TABLE plant_master (
  plant_id    VARCHAR(10)   PRIMARY KEY,
  plant_name  VARCHAR(100)  NOT NULL,
  location    VARCHAR(100)  NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE plant_master IS 'Manufacturing and warehouse plant locations';
COMMENT ON COLUMN plant_master.location IS 'City, Region string used in vendor location scoring';

-- ============================================================
-- 3. plant_material_mapping
-- ============================================================
CREATE TABLE plant_material_mapping (
  plant_id    VARCHAR(10)  NOT NULL REFERENCES plant_master(plant_id),
  material_id VARCHAR(20)  NOT NULL REFERENCES material_master(material_id),
  is_required BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plant_id, material_id)
);

COMMENT ON TABLE plant_material_mapping IS 'Which materials are stocked or required at which plants';
COMMENT ON COLUMN plant_material_mapping.is_required IS 'TRUE if plant must always maintain this material';

-- ============================================================
-- 4. vendor_master
-- (vendor_id + material_id composite PK)
-- ============================================================
CREATE TABLE vendor_master (
  vendor_id         VARCHAR(20)   NOT NULL,
  vendor_name       VARCHAR(200)  NOT NULL,
  material_id       VARCHAR(20)   NOT NULL REFERENCES material_master(material_id),
  unit_price        NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  lead_time_days    INTEGER       NOT NULL CHECK (lead_time_days > 0),
  quality_rating    NUMERIC(3,1)  NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  on_time_delivery  NUMERIC(5,2)  NOT NULL CHECK (on_time_delivery BETWEEN 0 AND 100),
  location          VARCHAR(100)  NOT NULL,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vendor_id, material_id)
);

COMMENT ON TABLE vendor_master IS 'Approved vendor list per material. One row per vendor-material combination.';
COMMENT ON COLUMN vendor_master.location IS 'Vendor location (City, Region) for logistics scoring vs plant location';
COMMENT ON COLUMN vendor_master.quality_rating IS '1.0-5.0 scale; 5.0 = highest quality';
COMMENT ON COLUMN vendor_master.on_time_delivery IS 'Percentage of orders delivered on time (0-100)';

-- ============================================================
-- 5. purchase_requisitions
-- ============================================================
CREATE TYPE pr_status AS ENUM (
  'CREATED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'PO_CREATED',
  'COMPLETED'
);

CREATE TABLE purchase_requisitions (
  pr_id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number       VARCHAR(20)   NOT NULL UNIQUE,
  material_id     VARCHAR(20)   NOT NULL REFERENCES material_master(material_id),
  plant_id        VARCHAR(10)   NOT NULL REFERENCES plant_master(plant_id),
  quantity        NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  required_date   DATE          NOT NULL,
  requestor_name  VARCHAR(100)  NOT NULL,
  requestor_email VARCHAR(200)  NOT NULL,
  planner_name    VARCHAR(100),
  planner_email   VARCHAR(200),
  status          pr_status     NOT NULL DEFAULT 'CREATED',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pr_updated_at
  BEFORE UPDATE ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for Agent 1: fetch last 7 days efficiently
CREATE INDEX idx_pr_created_at ON purchase_requisitions (created_at DESC);
CREATE INDEX idx_pr_material_plant ON purchase_requisitions (material_id, plant_id);

COMMENT ON TABLE purchase_requisitions IS 'All purchase requisitions created by requestors';
COMMENT ON COLUMN purchase_requisitions.pr_number IS 'Human-readable PR number, e.g. PR-2026-00001';

-- ============================================================
-- 6. inventory
-- ============================================================
CREATE TABLE inventory (
  inventory_id    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id     VARCHAR(20)   NOT NULL REFERENCES material_master(material_id),
  plant_id        VARCHAR(10)   NOT NULL REFERENCES plant_master(plant_id),
  available_stock NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
  safety_stock    NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  maximum_stock   NUMERIC(12,3) CHECK (maximum_stock >= 0),
  last_updated    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (material_id, plant_id)
);

COMMENT ON TABLE inventory IS 'Current stock levels per material per plant';
COMMENT ON COLUMN inventory.safety_stock IS 'Minimum buffer stock that must not be consumed by normal operations';
COMMENT ON COLUMN inventory.maximum_stock IS 'Maximum storage capacity — used for excess inventory cost calculation';

-- ============================================================
-- 7. demand_forecast
-- ============================================================
CREATE TABLE demand_forecast (
  forecast_id       UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id       VARCHAR(20)   NOT NULL REFERENCES material_master(material_id),
  plant_id          VARCHAR(10)   NOT NULL REFERENCES plant_master(plant_id),
  forecast_period   DATE          NOT NULL,
  forecast_quantity NUMERIC(12,3) NOT NULL CHECK (forecast_quantity >= 0),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (material_id, plant_id, forecast_period)
);

COMMENT ON TABLE demand_forecast IS 'Monthly demand forecasts per material per plant';
COMMENT ON COLUMN demand_forecast.forecast_period IS 'First day of the forecast month (monthly granularity)';

-- ============================================================
-- 8. purchase_orders
-- ============================================================
CREATE TYPE po_status AS ENUM (
  'CREATED',
  'SENT',
  'CONFIRMED',
  'DELIVERED',
  'CANCELLED'
);

CREATE TABLE purchase_orders (
  po_id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number              VARCHAR(20)   NOT NULL UNIQUE,
  pr_id                  UUID          NOT NULL REFERENCES purchase_requisitions(pr_id),
  vendor_id              VARCHAR(20)   NOT NULL,
  material_id            VARCHAR(20)   NOT NULL,
  quantity               NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price             NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  total_amount           NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  order_date             DATE          NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE          NOT NULL,
  status                 po_status     NOT NULL DEFAULT 'CREATED',
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  FOREIGN KEY (vendor_id, material_id) REFERENCES vendor_master(vendor_id, material_id)
);

CREATE TRIGGER po_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE purchase_orders IS 'Purchase orders created from approved PRs';
COMMENT ON COLUMN purchase_orders.total_amount IS 'Computed column: quantity × unit_price';

-- ============================================================
-- 9. ai_pr_analysis
-- ============================================================
CREATE TYPE decision_type AS ENUM ('APPROVE', 'REVIEW', 'REJECT');
CREATE TYPE risk_level_type AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE ai_pr_analysis (
  analysis_id       UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id             UUID            NOT NULL UNIQUE REFERENCES purchase_requisitions(pr_id),
  duplicate_result  JSONB,
  validation_result JSONB,
  inventory_result  JSONB,
  sourcing_result   JSONB,
  decision          decision_type,
  decision_reason   TEXT,
  risk_level        risk_level_type,
  estimated_savings NUMERIC(15,2),
  pipeline_error    TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER analysis_updated_at
  BEFORE UPDATE ON ai_pr_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE ai_pr_analysis IS 'Stores all AI pipeline outputs for a PR. One row per PR. Upsert on re-run.';
COMMENT ON COLUMN ai_pr_analysis.pipeline_error IS 'Error message if pipeline failed; used for UI error display';

-- ============================================================
-- 10. notifications
-- ============================================================
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'READ', 'EMAIL_FAILED');
CREATE TYPE recipient_type AS ENUM ('REQUESTOR', 'PLANNER', 'BUYER', 'SYSTEM');
CREATE TYPE notification_type AS ENUM (
  'APPROVE_NOTIFICATION',
  'REVIEW_NOTIFICATION',
  'REJECT_NOTIFICATION',
  'INVENTORY_ALERT',
  'SYSTEM_ALERT'
);

CREATE TABLE notifications (
  notification_id   UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id             UUID                REFERENCES purchase_requisitions(pr_id),
  recipient_name    VARCHAR(100)        NOT NULL,
  recipient_email   VARCHAR(200)        NOT NULL,
  recipient_type    recipient_type      NOT NULL,
  notification_type notification_type   NOT NULL,
  message           TEXT                NOT NULL,
  status            notification_status NOT NULL DEFAULT 'PENDING',
  sent_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  read_at           TIMESTAMPTZ
);

CREATE INDEX idx_notifications_email ON notifications (recipient_email);
CREATE INDEX idx_notifications_status ON notifications (status);
CREATE INDEX idx_notifications_pr ON notifications (pr_id);

COMMENT ON TABLE notifications IS 'In-app and email notifications. pr_id nullable for system-level alerts.';

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pr_analysis ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies for MVP demo
-- (Tighten these in production with proper auth)
CREATE POLICY "Allow all on purchase_requisitions"
  ON purchase_requisitions FOR ALL USING (true);

CREATE POLICY "Allow all on notifications"
  ON notifications FOR ALL USING (true);

CREATE POLICY "Allow all on ai_pr_analysis"
  ON ai_pr_analysis FOR ALL USING (true);

-- Master data: read-only from client
ALTER TABLE material_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read material_master"
  ON material_master FOR SELECT USING (true);

ALTER TABLE plant_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read plant_master"
  ON plant_master FOR SELECT USING (true);

ALTER TABLE plant_material_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read plant_material_mapping"
  ON plant_material_mapping FOR SELECT USING (true);

ALTER TABLE vendor_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read vendor_master"
  ON vendor_master FOR SELECT USING (true);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read inventory"
  ON inventory FOR SELECT USING (true);

ALTER TABLE demand_forecast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read demand_forecast"
  ON demand_forecast FOR SELECT USING (true);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on purchase_orders"
  ON purchase_orders FOR ALL USING (true);

-- ============================================================
-- PR Number Generation
-- ============================================================
CREATE OR REPLACE FUNCTION generate_pr_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  next_num INTEGER;
  pr_num VARCHAR(20);
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(pr_number FROM 9)::INTEGER), 0) + 1
  INTO next_num
  FROM purchase_requisitions
  WHERE pr_number LIKE 'PR-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  pr_num := 'PR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN pr_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PO Number Generation
-- ============================================================
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  next_num INTEGER;
  po_num VARCHAR(20);
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(po_number FROM 9)::INTEGER), 0) + 1
  INTO next_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  po_num := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN po_num;
END;
$$ LANGUAGE plpgsql;