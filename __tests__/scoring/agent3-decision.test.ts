import { computePreliminaryDecision } from '@/lib/scoring/agent3-decision'
import { runAgent3 } from '@/lib/agents/agent3'
import type { PurchaseRequisition, DuplicateResult, InventoryResult, SourcingResult } from '@/types'
import { DecisionResultSchema } from '@/lib/validation/agent-output-validation'

jest.setTimeout(15000)

describe('Agent 3 — Decision Engine (Module 8)', () => {
  const baseDuplicate: DuplicateResult = {
    duplicate_detected: false,
    overall_similarity_score: 10,
    confidence: 'LOW',
    matched_pr_id: null,
    matched_pr_number: null,
    material_match_score: 0,
    plant_match_score: 0,
    quantity_similarity_score: 0,
    required_date_similarity_score: 0,
    requestor_match_score: 0,
    time_gap_score: 0,
    explanation: 'Clean',
    evidence: [],
    recommended_action: 'Proceed',
  }

  const baseInventorySufficient: InventoryResult = {
    status: 'SUFFICIENT',
    available_stock: 500,
    safety_stock: 100,
    forecasted_demand: 100,
    usable_stock: 400,
    pr_quantity: 150,
    remaining_after_pr: 250,
    explanation: 'Sufficient stock',
    invoke_agent2: false,
  }

  const baseInventoryInsufficient: InventoryResult = {
    status: 'INSUFFICIENT',
    available_stock: 50,
    safety_stock: 100,
    forecasted_demand: 100,
    usable_stock: -50,
    pr_quantity: 200,
    remaining_after_pr: -250,
    explanation: 'Stock deficit',
    invoke_agent2: true,
  }

  const baseSourcing: SourcingResult = {
    recommended_vendor_id: 'VND-001',
    recommended_vendor_name: 'Precision Seal Co.',
    ranked_vendors: [
      {
        rank: 1,
        vendor_id: 'VND-001',
        vendor_name: 'Precision Seal Co.',
        unit_price: 45,
        lead_time_days: 7,
        vendor_location: 'Chicago, Illinois',
        quality_rating: 4.5,
        on_time_delivery: 95,
        price_score: 100,
        lead_time_score: 100,
        location_score: 100,
        quality_score: 88,
        on_time_delivery_score: 95,
        total_score: 97,
      },
    ],
    estimated_savings: 500,
    sourcing_risks: [],
    explanation: 'Best vendor',
    trade_off_summary: 'Clear winner',
    no_vendors_found: false,
  }

  describe('computePreliminaryDecision', () => {
    it('REJECTS when similarity >= 75 and matched PR is APPROVED', () => {
      const dup: DuplicateResult = {
        ...baseDuplicate,
        duplicate_detected: true,
        overall_similarity_score: 85,
        matched_pr_number: 'PR-2025-0010',
      }
      const result = computePreliminaryDecision(dup, baseInventorySufficient, null, 'APPROVED')
      expect(result.decision).toBe('REJECT')
      expect(result.risk_level).toBe('HIGH')
    })

    it('REJECTS when similarity >= 75 and matched PR is PO_CREATED or COMPLETED', () => {
      const dup: DuplicateResult = {
        ...baseDuplicate,
        duplicate_detected: true,
        overall_similarity_score: 80,
      }
      expect(computePreliminaryDecision(dup, baseInventorySufficient, null, 'PO_CREATED').decision).toBe('REJECT')
      expect(computePreliminaryDecision(dup, baseInventorySufficient, null, 'COMPLETED').decision).toBe('REJECT')
    })

    it('REVIEWS when similarity >= 75 and matched PR is still pending (CREATED / UNDER_REVIEW)', () => {
      const dup: DuplicateResult = {
        ...baseDuplicate,
        duplicate_detected: true,
        overall_similarity_score: 78,
      }
      expect(computePreliminaryDecision(dup, baseInventorySufficient, null, 'CREATED').decision).toBe('REVIEW')
      expect(computePreliminaryDecision(dup, baseInventorySufficient, null, 'UNDER_REVIEW').decision).toBe('REVIEW')
    })

    it('REVIEWS when similarity is 50-74 and inventory is INSUFFICIENT', () => {
      const dup: DuplicateResult = {
        ...baseDuplicate,
        duplicate_detected: false,
        overall_similarity_score: 60,
      }
      const result = computePreliminaryDecision(dup, baseInventoryInsufficient, baseSourcing)
      expect(result.decision).toBe('REVIEW')
      expect(result.risk_level).toBe('MEDIUM')
    })

    it('REVIEWS when no vendors are found and inventory is INSUFFICIENT', () => {
      const noVendorSourcing: SourcingResult = {
        ...baseSourcing,
        no_vendors_found: true,
        ranked_vendors: [],
      }
      const result = computePreliminaryDecision(baseDuplicate, baseInventoryInsufficient, noVendorSourcing)
      expect(result.decision).toBe('REVIEW')
      expect(result.risk_level).toBe('MEDIUM')
    })

    it('APPROVES when similarity < 50 and inventory is SUFFICIENT', () => {
      const result = computePreliminaryDecision(baseDuplicate, baseInventorySufficient, null)
      expect(result.decision).toBe('APPROVE')
      expect(result.risk_level).toBe('LOW')
    })

    it('APPROVES when similarity < 50 and inventory is INSUFFICIENT but vendor is found', () => {
      const result = computePreliminaryDecision(baseDuplicate, baseInventoryInsufficient, baseSourcing)
      expect(result.decision).toBe('APPROVE')
      expect(result.risk_level).toBe('LOW')
    })
  })

  describe('runAgent3 Integration', () => {
    const pr: PurchaseRequisition = {
      pr_id: 'pr-decision-001',
      pr_number: 'PR-2025-0894',
      material_id: 'MAT-8491',
      plant_id: 'PLT-01',
      quantity: 500,
      required_date: '2025-12-01',
      requestor_name: 'Eleanor Vance',
      requestor_email: 'eleanor@procureai.com',
      planner_name: 'System Planner',
      planner_email: 'planner@procureai.com',
      status: 'UNDER_REVIEW',
      created_at: '2025-11-01T10:00:00Z',
      updated_at: '2025-11-01T10:00:00Z',
    }

    it('returns valid DecisionResult for standard approval path', async () => {
      const result = await runAgent3(pr, baseDuplicate, baseInventorySufficient, null)
      expect(result.decision).toBe('APPROVE')
      expect(result.risk_level).toBe('LOW')
      expect(result.reason).toBeDefined()
      expect(result.recommended_next_step).toBeDefined()
      expect(Array.isArray(result.key_evidence)).toBe(true)

      // Validate Zod schema
      expect(DecisionResultSchema.safeParse(result).success).toBe(true)
    })

    it('returns REJECT with HIGH risk when PR is duplicate of approved order', async () => {
      const dup: DuplicateResult = {
        ...baseDuplicate,
        duplicate_detected: true,
        overall_similarity_score: 92,
        matched_pr_number: 'PR-2025-0800',
      }
      const result = await runAgent3(pr, dup, baseInventorySufficient, null, 'APPROVED')
      expect(result.decision).toBe('REJECT')
      expect(result.risk_level).toBe('HIGH')
      expect(result.reason.length).toBeGreaterThan(10)
      expect(DecisionResultSchema.safeParse(result).success).toBe(true)
    })

    it('returns REVIEW when no vendor contracts exist for an inventory deficit', async () => {
      const noVendors: SourcingResult = {
        ...baseSourcing,
        no_vendors_found: true,
        ranked_vendors: [],
      }
      const result = await runAgent3(pr, baseDuplicate, baseInventoryInsufficient, noVendors)
      expect(result.decision).toBe('REVIEW')
      expect(result.risk_level).toBe('MEDIUM')
      expect(DecisionResultSchema.safeParse(result).success).toBe(true)
    })
  })
})
