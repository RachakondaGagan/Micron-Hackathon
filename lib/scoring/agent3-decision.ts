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

  // 1. REJECT CONDITIONS
  // High similarity duplicate (>= 85%, including 100% exact clones) is ALWAYS rejected
  if (
    duplicateResult.duplicate_detected &&
    duplicateResult.overall_similarity_score >= 85
  ) {
    return { decision: 'REJECT', risk_level: 'HIGH' }
  }

  // Duplicate (>= 75%) matching a completed, approved, or rejected PR is rejected
  const blockedStatuses = ['APPROVED', 'PO_CREATED', 'COMPLETED', 'REJECTED']
  if (
    duplicateResult.overall_similarity_score >= 75 &&
    duplicateResult.duplicate_detected &&
    blockedStatuses.includes(normStatus)
  ) {
    return { decision: 'REJECT', risk_level: 'HIGH' }
  }

  if (inventoryResult.pr_quantity <= 0) {
    return { decision: 'REJECT', risk_level: 'HIGH' }
  }

  // 2. REVIEW CONDITIONS
  const pendingStatuses = ['CREATED', 'UNDER_REVIEW', '']
  if (
    duplicateResult.overall_similarity_score >= 75 &&
    duplicateResult.duplicate_detected &&
    (pendingStatuses.includes(normStatus) || !normStatus)
  ) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  if (
    duplicateResult.overall_similarity_score >= 50 &&
    duplicateResult.overall_similarity_score < 75 &&
    inventoryResult.status === 'INSUFFICIENT'
  ) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  // Duplicate flagged below 85% with pending match — route to human review
  if (duplicateResult.duplicate_detected) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  if (
    inventoryResult.status !== 'SUFFICIENT' &&
    (!sourcingResult || sourcingResult.no_vendors_found)
  ) {
    return { decision: 'REVIEW', risk_level: 'MEDIUM' }
  }

  // 3. APPROVE CONDITIONS (Default)
  return { decision: 'APPROVE', risk_level: 'LOW' }
}
