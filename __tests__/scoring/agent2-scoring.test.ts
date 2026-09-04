import {
  calculatePriceScore,
  calculateLeadTimeScore,
  calculateLocationScore,
  calculateQualityScore,
  calculateOnTimeDeliveryScore,
  calculateTotalVendorScore,
  estimateSavings,
} from '@/lib/scoring/agent2-scoring'
import { runAgent2 } from '@/lib/agents/agent2'
import type { PurchaseRequisition, InventoryResult, VendorMaster } from '@/types'
import { SourcingResultSchema } from '@/lib/validation/agent-output-validation'

jest.setTimeout(15000)

describe('Agent 2 — Vendor Sourcing Scoring Formulas', () => {
  describe('calculatePriceScore', () => {
    it('gives 100 to the lowest price and 0 to the highest price', () => {
      const prices = [10, 20, 30]
      expect(calculatePriceScore(10, prices)).toBe(100)
      expect(calculatePriceScore(30, prices)).toBe(0)
      expect(calculatePriceScore(20, prices)).toBe(50)
    })

    it('returns 100 when all vendors offer the same price', () => {
      const prices = [25, 25, 25]
      expect(calculatePriceScore(25, prices)).toBe(100)
    })

    it('returns 100 for a single vendor', () => {
      expect(calculatePriceScore(50, [50])).toBe(100)
    })
  })

  describe('calculateLeadTimeScore', () => {
    it('gives 100 to the fastest lead time and 0 to the slowest', () => {
      const leadTimes = [3, 7, 11]
      expect(calculateLeadTimeScore(3, leadTimes)).toBe(100)
      expect(calculateLeadTimeScore(11, leadTimes)).toBe(0)
      expect(calculateLeadTimeScore(7, leadTimes)).toBe(50)
    })

    it('returns 100 when all vendors offer the same lead time', () => {
      expect(calculateLeadTimeScore(5, [5, 5])).toBe(100)
    })
  })

  describe('calculateLocationScore', () => {
    it('returns 100 for exact city and state match', () => {
      expect(calculateLocationScore('Chicago, Illinois', 'Chicago, Illinois')).toBe(100)
    })

    it('returns 100 when city matches even with slight casing difference', () => {
      expect(calculateLocationScore('chicago, illinois', 'Chicago, Illinois')).toBe(100)
    })

    it('returns 50 for same state/region but different city', () => {
      expect(calculateLocationScore('Dallas, Texas', 'Houston, Texas')).toBe(50)
    })

    it('returns 0 for different states/regions', () => {
      expect(calculateLocationScore('Newark, New Jersey', 'Houston, Texas')).toBe(0)
    })
  })

  describe('calculateQualityScore', () => {
    it('converts 1-5 scale accurately', () => {
      expect(calculateQualityScore(5.0)).toBe(100)
      expect(calculateQualityScore(1.0)).toBe(0)
      expect(calculateQualityScore(3.0)).toBe(50)
      expect(calculateQualityScore(4.5)).toBe(88)
    })
  })

  describe('calculateOnTimeDeliveryScore', () => {
    it('returns direct percentage bounded between 0 and 100', () => {
      expect(calculateOnTimeDeliveryScore(95.5)).toBe(96)
      expect(calculateOnTimeDeliveryScore(100)).toBe(100)
      expect(calculateOnTimeDeliveryScore(0)).toBe(0)
    })
  })

  describe('calculateTotalVendorScore', () => {
    it('calculates weighted composite score accurately (30/25/20/15/10)', () => {
      // All 100s -> 100
      expect(
        calculateTotalVendorScore({
          price_score: 100,
          lead_time_score: 100,
          location_score: 100,
          quality_score: 100,
          on_time_delivery_score: 100,
        })
      ).toBe(100)

      // Test specific weights: price=100 (30), lead=0, loc=0, qual=0, otd=0 -> 30
      expect(
        calculateTotalVendorScore({
          price_score: 100,
          lead_time_score: 0,
          location_score: 0,
          quality_score: 0,
          on_time_delivery_score: 0,
        })
      ).toBe(30)
    })
  })

  describe('estimateSavings', () => {
    it('calculates savings when rank 2 vendor is more expensive than rank 1', () => {
      const vendors = [{ unit_price: 45.0 }, { unit_price: 52.0 }]
      expect(estimateSavings(vendors, 100)).toBe(700) // (52 - 45) * 100
    })

    it('returns null if fewer than 2 vendors exist', () => {
      expect(estimateSavings([{ unit_price: 50.0 }], 100)).toBeNull()
    })

    it('returns null if rank 2 is same price or cheaper', () => {
      expect(estimateSavings([{ unit_price: 50.0 }, { unit_price: 50.0 }], 100)).toBeNull()
    })
  })
})

describe('runAgent2 Integration', () => {
  const pr: PurchaseRequisition = {
    pr_id: 'pr-test-001',
    pr_number: 'PR-2025-0001',
    material_id: 'MAT-002',
    plant_id: 'PLT-02',
    quantity: 1000,
    required_date: '2025-12-01',
    requestor_name: 'Eleanor Vance',
    requestor_email: 'eleanor@procureai.com',
    planner_name: 'System Planner',
    planner_email: 'planner@procureai.com',
    status: 'UNDER_REVIEW',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
  }

  const inventoryResult: InventoryResult = {
    status: 'INSUFFICIENT',
    available_stock: 50,
    safety_stock: 200,
    forecasted_demand: 100,
    usable_stock: -50,
    pr_quantity: 1000,
    remaining_after_pr: -1050,
    explanation: 'Inventory deficit',
    invoke_agent2: true,
  }

  const vendors: VendorMaster[] = [
    {
      vendor_id: 'VND-003',
      vendor_name: 'LubeMax Industries',
      material_id: 'MAT-002',
      unit_price: 8.5,
      lead_time_days: 5,
      quality_rating: 4.0,
      on_time_delivery: 92.0,
      location: 'Houston, Texas',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      vendor_id: 'VND-004',
      vendor_name: 'FluidTech Supply',
      material_id: 'MAT-002',
      unit_price: 9.2,
      lead_time_days: 3,
      quality_rating: 4.8,
      on_time_delivery: 97.0,
      location: 'Chicago, Illinois',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
    },
  ]

  it('ranks multiple vendors and calculates estimated savings', async () => {
    const result = await runAgent2(pr, vendors, inventoryResult, 'Houston, Texas')

    expect(result.no_vendors_found).toBe(false)
    expect(result.ranked_vendors.length).toBe(2)
    expect(result.ranked_vendors[0].rank).toBe(1)
    expect(result.ranked_vendors[1].rank).toBe(2)
    expect(result.recommended_vendor_id).toBe(result.ranked_vendors[0].vendor_id)
    expect(result.explanation).toBeDefined()
    expect(result.trade_off_summary).toBeDefined()
    expect(Array.isArray(result.sourcing_risks)).toBe(true)

    // Validate Zod schema
    expect(SourcingResultSchema.safeParse(result).success).toBe(true)
  })

  it('handles sole-source supplier when only 1 vendor exists', async () => {
    const soleVendor = [vendors[0]]
    const result = await runAgent2(pr, soleVendor, inventoryResult, 'Houston, Texas')

    expect(result.no_vendors_found).toBe(false)
    expect(result.ranked_vendors.length).toBe(1)
    expect(result.recommended_vendor_id).toBe('VND-003')
    expect(result.estimated_savings).toBeNull()

    expect(SourcingResultSchema.safeParse(result).success).toBe(true)
  })

  it('handles zero eligible vendors cleanly', async () => {
    const result = await runAgent2(pr, [], inventoryResult, 'Houston, Texas')

    expect(result.no_vendors_found).toBe(true)
    expect(result.ranked_vendors.length).toBe(0)
    expect(result.recommended_vendor_id).toBe('')
    expect(result.estimated_savings).toBeNull()
    expect(result.explanation).toContain('No active qualified suppliers')

    expect(SourcingResultSchema.safeParse(result).success).toBe(true)
  })
})
