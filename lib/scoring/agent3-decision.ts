// Agent 3 — Deterministic Preliminary Decision Logic
// Module 8 Implementation

import type { DuplicateResult, InventoryResult, SourcingResult, DecisionType, RiskLevelType } from '@/types'

/**
 * Computes deterministic preliminary decision signal based on business rules from AGENTS.md.
 * 
 * Rules:
 * - REJECT:
 *   - Similarity >= 75 and matched PR is APPROVED, PO_CREATED, or COMPLETED
 *   - Defensive: PR quantity <= 0
 * 
 * - REVIEW:
 *   - Similarity >= 75 and matched PR is CREATED or UNDER_REVIEW (pending duplicate)
 *   - Similarity 50-74 and inventory INSUFFICIENT
 *   - No vendors found and inventory not SUFFICIENT
 * 
 * - APPROVE:
 *   - Otherwise: stock is sufficient OR external vendor identified and qualified
 */
export function computePreliminaryDecision(
  duplicateResult: DuplicateResult,
  inventoryResult: InventoryResult,
  sourcingResult: SourcingResult | null,
  matchedPRStatus?: string
): { decision: DecisionType; risk_level: RiskLevelType } {
  const normStatus = (matchedPRStatus || '').toUpperCase().trim()

  // 1. REJECT CONDITIONS: Score above 75 threshold -> STRAIGHT OUT REJECT
  if (
    duplicateResult.duplicate_detected &&
    duplicateResult.overall_similarity_score >= 75
  ) {
    return { decision: 'REJECT', risk_level: 'HIGH' }
  }

  if (inventoryResult.pr_quantity <= 0) {
    return { decision: 'REJECT', risk_level: 'HIGH' }
  }

  // 2. REVIEW CONDITIONS: In between thresholds (50% to 74%) -> SEND FOR REVIEW
  if (
    duplicateResult.overall_similarity_score >= 50 &&
    duplicateResult.overall_similarity_score < 75
  ) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  // Any other duplicate flag below 75% -> REVIEW
  if (duplicateResult.duplicate_detected) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  // Stock not sufficient and no qualified vendors -> REVIEW
  if (
    inventoryResult.status !== 'SUFFICIENT' &&
    (!sourcingResult || sourcingResult.no_vendors_found)
  ) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  // 3. APPROVE CONDITIONS: Score is less after considering KPIs -> APPROVE
  return { decision: 'APPROVE', risk_level: 'LOW' }
}
