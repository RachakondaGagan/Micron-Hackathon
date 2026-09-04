// ============================================================
// Database Table Types
// ============================================================

export interface MaterialMaster {
  material_id: string
  material_name: string
  description: string | null
  material_group: 'RAW_MATERIAL' | 'SPARE_PART' | 'CONSUMABLE' | 'EQUIPMENT'
  unit_of_measure: string
  is_active: boolean
  created_at: string
}

export interface PlantMaster {
  plant_id: string
  plant_name: string
  location: string
  is_active: boolean
  created_at: string
}

export interface PlantMaterialMapping {
  plant_id: string
  material_id: string
  is_required: boolean
  is_active: boolean
  created_at: string
}

export interface VendorMaster {
  vendor_id: string
  vendor_name: string
  material_id: string
  unit_price: number
  lead_time_days: number
  quality_rating: number
  on_time_delivery: number
  location: string
  is_active: boolean
  created_at: string
}

export type PRStatus = 'CREATED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PO_CREATED' | 'COMPLETED'

export interface PurchaseRequisition {
  pr_id: string
  pr_number: string
  material_id: string
  plant_id: string
  quantity: number
  required_date: string
  requestor_name: string
  requestor_email: string
  planner_name: string | null
  planner_email: string | null
  status: PRStatus
  created_at: string
  updated_at: string
}

export interface Inventory {
  inventory_id: string
  material_id: string
  plant_id: string
  available_stock: number
  safety_stock: number
  maximum_stock: number | null
  last_updated: string
}

export interface DemandForecast {
  forecast_id: string
  material_id: string
  plant_id: string
  forecast_period: string
  forecast_quantity: number
  created_at: string
}

export type POStatus = 'CREATED' | 'SENT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'

export interface PurchaseOrder {
  po_id: string
  po_number: string
  pr_id: string
  vendor_id: string
  material_id: string
  quantity: number
  unit_price: number
  total_amount: number
  order_date: string
  expected_delivery_date: string
  status: POStatus
  created_at: string
  updated_at: string
}

export type DecisionType = 'APPROVE' | 'REVIEW' | 'REJECT'
export type RiskLevelType = 'LOW' | 'MEDIUM' | 'HIGH'
export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'EMAIL_FAILED'
export type RecipientType = 'REQUESTOR' | 'PLANNER' | 'BUYER' | 'SYSTEM'
export type NotificationType = 'APPROVE_NOTIFICATION' | 'REVIEW_NOTIFICATION' | 'REJECT_NOTIFICATION' | 'INVENTORY_ALERT' | 'SYSTEM_ALERT'

export interface AIPRAnalysis {
  analysis_id: string
  pr_id: string
  duplicate_result: DuplicateResult | null
  validation_result: object | null
  inventory_result: InventoryResult | null
  sourcing_result: SourcingResult | null
  decision: DecisionType | null
  decision_reason: string | null
  risk_level: RiskLevelType | null
  estimated_savings: number | null
  pipeline_error: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  notification_id: string
  pr_id: string | null
  recipient_name: string
  recipient_email: string
  recipient_type: RecipientType
  notification_type: NotificationType
  message: string
  status: NotificationStatus
  sent_at: string
  read_at: string | null
}

// ============================================================
// Agent Output Types
// ============================================================

export interface DuplicateResult {
  duplicate_detected: boolean
  overall_similarity_score: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  matched_pr_id: string | null
  matched_pr_number: string | null
  material_match_score: number
  plant_match_score: number
  quantity_similarity_score: number
  required_date_similarity_score: number
  requestor_match_score: number
  time_gap_score: number
  explanation: string
  evidence: string[]
  recommended_action: string
}

export interface InventoryResult {
  status: 'SUFFICIENT' | 'AT_RISK' | 'INSUFFICIENT'
  available_stock: number
  safety_stock: number
  forecasted_demand: number
  usable_stock: number
  pr_quantity: number
  remaining_after_pr: number
  explanation: string
  invoke_agent2: boolean
}

export interface SourcingResult {
  recommended_vendor_id: string
  recommended_vendor_name: string
  ranked_vendors: Array<{
    rank: number
    vendor_id: string
    vendor_name: string
    unit_price: number
    lead_time_days: number
    vendor_location: string
    quality_rating: number
    on_time_delivery: number
    price_score: number
    lead_time_score: number
    location_score: number
    quality_score: number
    on_time_delivery_score: number
    total_score: number
  }>
  estimated_savings: number | null
  sourcing_risks: string[]
  explanation: string
  trade_off_summary: string
  no_vendors_found: boolean
}

export interface DecisionResult {
  decision: DecisionType
  reason: string
  risk_level: RiskLevelType
  key_evidence: string[]
  recommended_next_step: string
}

export interface NotificationResult {
  notification_id: string
  recipient_email: string
  recipient_type: RecipientType
  message: string
  in_app_created: boolean
  email_sent: boolean
  email_error: string | null
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  } | null
}
