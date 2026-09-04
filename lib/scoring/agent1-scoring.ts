// Agent 1 — Deterministic KPI Score Calculations
// Module 5 Implementation

/**
 * 1. Material Match (weight: 5/23 = 21.7%)
 * Binary: Same material = 100, different = 0
 */
export function calculateMaterialMatch(newMaterialId: string, histMaterialId: string): number {
  return newMaterialId === histMaterialId ? 100 : 0
}

/**
 * 2. Plant Match (weight: 4/23 = 17.4%)
 * Binary: Same plant = 100, different = 0
 */
export function calculatePlantMatch(newPlantId: string, histPlantId: string): number {
  return newPlantId === histPlantId ? 100 : 0
}

/**
 * 3. Quantity Similarity (weight: 3/23 = 13.0%)
 * qty_diff_pct = abs(new - hist) / max(new, hist)
 * score = max(0, round((1 - qty_diff_pct) * 100))
 */
export function calculateQuantitySimilarity(newQty: number, histQty: number): number {
  if (newQty <= 0 && histQty <= 0) return 100
  const maxQty = Math.max(newQty, histQty)
  if (maxQty === 0) return 100
  const qtyDiffPct = Math.abs(newQty - histQty) / maxQty
  return Math.max(0, Math.round((1 - qtyDiffPct) * 100))
}

/**
 * 4. Date Similarity (weight: 4/23 = 17.4%)
 * date_diff_days = abs(daysBetween(newDate, histDate))
 * score = max(0, round((1 - min(days, 30) / 30) * 100))
 */
export function calculateDateSimilarity(newDate: string, histDate: string): number {
  const d1 = new Date(newDate).getTime()
  const d2 = new Date(histDate).getTime()
  if (isNaN(d1) || isNaN(d2)) return 0
  const dateDiffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.round((1 - Math.min(dateDiffDays, 30) / 30) * 100))
}

/**
 * 5. Requestor Match (weight: 2/23 = 8.7%)
 * Binary: Same email = 100, different = 0
 */
export function calculateRequestorMatch(newEmail: string, histEmail: string): number {
  return newEmail.toLowerCase().trim() === histEmail.toLowerCase().trim() ? 100 : 0
}

/**
 * 6. Time Gap Score (weight: 5/23 = 21.7%)
 * hours_since = hoursBetween(hist.created_at, newPR.created_at)
 * score = max(0, round((1 - min(hours, 168) / 168) * 100))
 */
export function calculateTimeGapScore(newCreatedAt: string, histCreatedAt: string): number {
  const t1 = new Date(newCreatedAt).getTime()
  const t2 = new Date(histCreatedAt).getTime()
  if (isNaN(t1) || isNaN(t2)) return 0
  const hoursSince = Math.abs(t1 - t2) / (1000 * 60 * 60)
  return Math.max(0, Math.round((1 - Math.min(hoursSince, 168) / 168) * 100))
}

/**
 * 7. Overall Similarity Score (derived output)
 * Weighted sum / 23 (weights: material=5, plant=4, qty=3, date=4, req=2, time=5)
 */
export function calculateOverallSimilarity(scores: {
  material_match: number
  plant_match: number
  quantity_similarity: number
  date_similarity: number
  requestor_match: number
  time_gap_score: number
}): number {
  const weightedSum =
    scores.material_match * 5 +
    scores.plant_match * 4 +
    scores.quantity_similarity * 3 +
    scores.date_similarity * 4 +
    scores.requestor_match * 2 +
    scores.time_gap_score * 5

  const rawScore = Math.round(weightedSum / 23)

  // Critical Domain Invariant:
  // If material SKU does NOT match (different semiconductor materials),
  // duplicate similarity cannot exceed 25%. Different materials are never duplicates.
  if (scores.material_match === 0) {
    return Math.min(25, rawScore)
  }

  return rawScore
}
