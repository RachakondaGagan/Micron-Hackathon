import {
  calculateMaterialMatch,
  calculatePlantMatch,
  calculateQuantitySimilarity,
  calculateDateSimilarity,
  calculateRequestorMatch,
  calculateTimeGapScore,
  calculateOverallSimilarity,
} from '@/lib/scoring/agent1-scoring'

describe('Agent 1 Scoring Formulas', () => {
  describe('calculateMaterialMatch', () => {
    it('returns 100 for identical material IDs', () => {
      expect(calculateMaterialMatch('MAT-8491', 'MAT-8491')).toBe(100)
    })

    it('returns 0 for different material IDs', () => {
      expect(calculateMaterialMatch('MAT-8491', 'MAT-1020')).toBe(0)
    })
  })

  describe('calculatePlantMatch', () => {
    it('returns 100 for identical plant IDs', () => {
      expect(calculatePlantMatch('PLANT-1002', 'PLANT-1002')).toBe(100)
    })

    it('returns 0 for different plant IDs', () => {
      expect(calculatePlantMatch('PLANT-1002', 'PLANT-1001')).toBe(0)
    })
  })

  describe('calculateQuantitySimilarity', () => {
    it('returns 100 for identical quantities', () => {
      expect(calculateQuantitySimilarity(1000, 1000)).toBe(100)
    })

    it('returns 90 for 10% difference (100 vs 90)', () => {
      expect(calculateQuantitySimilarity(100, 90)).toBe(90)
    })

    it('returns 50 for 50% difference (100 vs 200)', () => {
      expect(calculateQuantitySimilarity(100, 200)).toBe(50)
    })

    it('returns 0 when difference is 100% or greater', () => {
      expect(calculateQuantitySimilarity(100, 0)).toBe(0)
    })
  })

  describe('calculateDateSimilarity', () => {
    it('returns 100 for identical dates', () => {
      expect(calculateDateSimilarity('2025-11-15', '2025-11-15')).toBe(100)
    })

    it('returns 50 for dates 15 days apart', () => {
      expect(calculateDateSimilarity('2025-11-01', '2025-11-16')).toBe(50)
    })

    it('returns 0 for dates >= 30 days apart', () => {
      expect(calculateDateSimilarity('2025-11-01', '2025-12-05')).toBe(0)
    })
  })

  describe('calculateRequestorMatch', () => {
    it('returns 100 for identical emails', () => {
      expect(calculateRequestorMatch('eleanor@procureai.com', 'eleanor@procureai.com')).toBe(100)
    })

    it('is case-insensitive and trims whitespace', () => {
      expect(calculateRequestorMatch(' Eleanor@procureai.com ', 'eleanor@procureai.com')).toBe(100)
    })

    it('returns 0 for different emails', () => {
      expect(calculateRequestorMatch('eleanor@procureai.com', 'buyer@procureai.com')).toBe(0)
    })
  })

  describe('calculateTimeGapScore', () => {
    it('returns 100 for identical timestamps', () => {
      const now = new Date().toISOString()
      expect(calculateTimeGapScore(now, now)).toBe(100)
    })

    it('returns 50 for timestamps 84 hours (3.5 days) apart', () => {
      const d1 = new Date('2025-11-01T00:00:00Z').toISOString()
      const d2 = new Date('2025-11-04T12:00:00Z').toISOString() // exactly 84 hours later
      expect(calculateTimeGapScore(d1, d2)).toBe(50)
    })

    it('returns 0 for timestamps >= 168 hours (7 days) apart', () => {
      const d1 = new Date('2025-11-01T00:00:00Z').toISOString()
      const d2 = new Date('2025-11-09T00:00:00Z').toISOString() // 8 days later
      expect(calculateTimeGapScore(d1, d2)).toBe(0)
    })
  })

  describe('calculateOverallSimilarity', () => {
    it('returns 100 when all scores are 100', () => {
      expect(
        calculateOverallSimilarity({
          material_match: 100,
          plant_match: 100,
          quantity_similarity: 100,
          date_similarity: 100,
          requestor_match: 100,
          time_gap_score: 100,
        })
      ).toBe(100)
    })

    it('returns 0 when all scores are 0', () => {
      expect(
        calculateOverallSimilarity({
          material_match: 0,
          plant_match: 0,
          quantity_similarity: 0,
          date_similarity: 0,
          requestor_match: 0,
          time_gap_score: 0,
        })
      ).toBe(0)
    })

    it('weights sum exactly to 23 (5+4+3+4+2+5)', () => {
      // Test individual weight contribution
      // Material (weight 5): 100 * 5 / 23 = 21.739 -> round to 22
      expect(
        calculateOverallSimilarity({
          material_match: 100,
          plant_match: 0,
          quantity_similarity: 0,
          date_similarity: 0,
          requestor_match: 0,
          time_gap_score: 0,
        })
      ).toBe(22)

      // Duplicate threshold check: material(5) + plant(4) + qty(3) + time(5) = 17 * 100 / 23 = 73.9 -> 74
      // With date(4) at 50%: (500 + 400 + 300 + 200 + 0 + 500) / 23 = 1900 / 23 = 82.6 -> 83 (HIGH duplicate)
      expect(
        calculateOverallSimilarity({
          material_match: 100,
          plant_match: 100,
          quantity_similarity: 100,
          date_similarity: 50,
          requestor_match: 0,
          time_gap_score: 100,
        })
      ).toBe(83)
    })
  })
})
