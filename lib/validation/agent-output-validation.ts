// Agent Output Validation — Zod Schemas
// Implemented alongside each agent module

import { z } from 'zod'

export const DuplicateResultSchema = z.object({
  duplicate_detected: z.boolean(),
  overall_similarity_score: z.number().min(0).max(100),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  matched_pr_id: z.string().nullable(),
  matched_pr_number: z.string().nullable(),
  material_match_score: z.number().min(0).max(100),
  plant_match_score: z.number().min(0).max(100),
  quantity_similarity_score: z.number().min(0).max(100),
  required_date_similarity_score: z.number().min(0).max(100),
  requestor_match_score: z.number().min(0).max(100),
  time_gap_score: z.number().min(0).max(100),
  explanation: z.string(),
  evidence: z.array(z.string()),
  recommended_action: z.string(),
})

export const InventoryResultSchema = z.object({
  status: z.enum(['SUFFICIENT', 'AT_RISK', 'INSUFFICIENT']),
  available_stock: z.number(),
  safety_stock: z.number(),
  forecasted_demand: z.number(),
  usable_stock: z.number(),
  pr_quantity: z.number(),
  remaining_after_pr: z.number(),
  explanation: z.string(),
  invoke_agent2: z.boolean(),
})

export const SourcingResultSchema = z.object({
  recommended_vendor_id: z.string(),
  recommended_vendor_name: z.string(),
  ranked_vendors: z.array(z.object({
    rank: z.number(),
    vendor_id: z.string(),
    vendor_name: z.string(),
    unit_price: z.number(),
    lead_time_days: z.number(),
    vendor_location: z.string(),
    quality_rating: z.number(),
    on_time_delivery: z.number(),
    price_score: z.number(),
    lead_time_score: z.number(),
    location_score: z.number(),
    quality_score: z.number(),
    on_time_delivery_score: z.number(),
    total_score: z.number(),
  })),
  estimated_savings: z.number().nullable(),
  sourcing_risks: z.array(z.string()),
  explanation: z.string(),
  trade_off_summary: z.string(),
  no_vendors_found: z.boolean(),
})

export const DecisionResultSchema = z.object({
  decision: z.enum(['APPROVE', 'REVIEW', 'REJECT']),
  reason: z.string(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  key_evidence: z.array(z.string()),
  recommended_next_step: z.string(),
})
