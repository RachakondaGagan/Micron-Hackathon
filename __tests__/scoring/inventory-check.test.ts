import { calculateInventoryResult } from '@/lib/scoring/inventory-check'
import { InventoryResultSchema } from '@/lib/validation/agent-output-validation'

describe('Deterministic Inventory Check (Module 6)', () => {
  describe('calculateInventoryResult', () => {
    it('returns SUFFICIENT when remaining stock meets or exceeds safety stock', () => {
      const result = calculateInventoryResult({
        availableStock: 500,
        safetyStock: 100,
        forecastedDemand: 100,
        prQuantity: 200,
      })

      expect(result.status).toBe('SUFFICIENT')
      expect(result.available_stock).toBe(500)
      expect(result.safety_stock).toBe(100)
      expect(result.forecasted_demand).toBe(100)
      expect(result.usable_stock).toBe(400) // 500 - 100
      expect(result.pr_quantity).toBe(200)
      expect(result.remaining_after_pr).toBe(200) // 400 - 200
      expect(result.invoke_agent2).toBe(false)
      expect(result.explanation).toContain('satisfies the safety stock target')

      // Validate Zod schema
      expect(InventoryResultSchema.safeParse(result).success).toBe(true)
    })

    it('returns AT_RISK when usable stock covers PR but remaining falls below safety stock', () => {
      const result = calculateInventoryResult({
        availableStock: 300,
        safetyStock: 250,
        forecastedDemand: 50,
        prQuantity: 20,
      })

      expect(result.status).toBe('AT_RISK')
      expect(result.usable_stock).toBe(250) // 300 - 50
      expect(result.remaining_after_pr).toBe(230) // 250 - 20 >= 0 but < 250
      expect(result.invoke_agent2).toBe(true)
      expect(result.explanation).toContain('is below safety stock target')

      // Validate Zod schema
      expect(InventoryResultSchema.safeParse(result).success).toBe(true)
    })

    it('returns INSUFFICIENT when usable stock is less than PR quantity', () => {
      const result = calculateInventoryResult({
        availableStock: 80,
        safetyStock: 150,
        forecastedDemand: 30,
        prQuantity: 100,
      })

      expect(result.status).toBe('INSUFFICIENT')
      expect(result.usable_stock).toBe(50) // 80 - 30
      expect(result.remaining_after_pr).toBe(-50) // 50 - 100 < 0
      expect(result.invoke_agent2).toBe(true)
      expect(result.explanation).toContain('deficit of 50')

      // Validate Zod schema
      expect(InventoryResultSchema.safeParse(result).success).toBe(true)
    })

    it('handles missing inventory record cleanly as INSUFFICIENT', () => {
      const result = calculateInventoryResult({
        availableStock: 0,
        safetyStock: 0,
        forecastedDemand: 0,
        prQuantity: 500,
        hasInventoryRecord: false,
      })

      expect(result.status).toBe('INSUFFICIENT')
      expect(result.usable_stock).toBe(0)
      expect(result.remaining_after_pr).toBe(-500)
      expect(result.invoke_agent2).toBe(true)
      expect(result.explanation).toContain('No active inventory record found')

      expect(InventoryResultSchema.safeParse(result).success).toBe(true)
    })

    it('handles missing forecast by assuming demand = 0 and logging note', () => {
      const result = calculateInventoryResult({
        availableStock: 1000,
        safetyStock: 200,
        forecastedDemand: 0,
        prQuantity: 300,
        hasForecastRecord: false,
      })

      expect(result.status).toBe('SUFFICIENT')
      expect(result.forecasted_demand).toBe(0)
      expect(result.usable_stock).toBe(1000)
      expect(result.remaining_after_pr).toBe(700)
      expect(result.explanation).toContain('No future demand forecast record was found')

      expect(InventoryResultSchema.safeParse(result).success).toBe(true)
    })

    it('treats negative available stock as 0', () => {
      const result = calculateInventoryResult({
        availableStock: -50,
        safetyStock: 100,
        forecastedDemand: 50,
        prQuantity: 100,
      })

      expect(result.status).toBe('INSUFFICIENT')
      expect(result.available_stock).toBe(0)
      expect(result.usable_stock).toBe(-50)
      expect(result.remaining_after_pr).toBe(-150)
      expect(result.invoke_agent2).toBe(true)

      expect(InventoryResultSchema.safeParse(result).success).toBe(true)
    })
  })
})
