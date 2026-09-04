// Agent 2 — Deterministic Vendor Scoring
// Module 7 Implementation
// Weights: Price (30%), Lead Time (25%), Location (20%), Quality (15%), OTD (10%)

/**
 * Price Score: Cheaper vendor receives higher score.
 * If all vendors have identical price, all receive 100.
 */
export function calculatePriceScore(vendorPrice: number, allPrices: number[]): number {
  if (allPrices.length <= 1) return 100
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  if (minPrice === maxPrice) return 100
  return Math.max(0, Math.round(((maxPrice - vendorPrice) / (maxPrice - minPrice)) * 100))
}

/**
 * Lead Time Score: Faster vendor receives higher score.
 * If all vendors have identical lead time, all receive 100.
 */
export function calculateLeadTimeScore(vendorLeadTime: number, allLeadTimes: number[]): number {
  if (allLeadTimes.length <= 1) return 100
  const minLead = Math.min(...allLeadTimes)
  const maxLead = Math.max(...allLeadTimes)
  if (minLead === maxLead) return 100
  return Math.max(0, Math.round(((maxLead - vendorLeadTime) / (maxLead - minLead)) * 100))
}

/**
 * Location Score: Regional proximity matching.
 * Same city = 100, Same region/state = 50, Otherwise = 0.
 */
export function calculateLocationScore(vendorLocation: string, plantLocation: string): number {
  if (!vendorLocation || !plantLocation) return 0

  const vNorm = vendorLocation.toLowerCase().trim()
  const pNorm = plantLocation.toLowerCase().trim()

  if (vNorm === pNorm) return 100

  // Split by comma: [city, state/region]
  const vParts = vNorm.split(',').map((s) => s.trim())
  const pParts = pNorm.split(',').map((s) => s.trim())

  // Exact city match
  if (vParts[0] && pParts[0] && vParts[0] === pParts[0]) {
    return 100
  }

  // Region / State match
  const vState = vParts.length > 1 ? vParts[1] : vParts[0]
  const pState = pParts.length > 1 ? pParts[1] : pParts[0]

  if (vState && pState && (vState === pState || vNorm.includes(pState) || pNorm.includes(vState))) {
    return 50
  }

  return 0
}

/**
 * Quality Score: 1-5 rating scale converted to 0-100 percentage.
 * Rating 1 -> 0, Rating 5 -> 100.
 */
export function calculateQualityScore(qualityRating: number): number {
  const clamped = Math.max(1, Math.min(5, qualityRating))
  return Math.round(((clamped - 1) / 4) * 100)
}

/**
 * On-Time Delivery Score: Already a 0-100 percentage.
 */
export function calculateOnTimeDeliveryScore(onTimeDelivery: number): number {
  return Math.max(0, Math.min(100, Math.round(onTimeDelivery)))
}

/**
 * Total Weighted Score:
 * Price 30% + Lead Time 25% + Location 20% + Quality 15% + OTD 10% = 100%
 */
export function calculateTotalVendorScore(scores: {
  price_score: number
  lead_time_score: number
  location_score: number
  quality_score: number
  on_time_delivery_score: number
}): number {
  const weighted =
    scores.price_score * 0.3 +
    scores.lead_time_score * 0.25 +
    scores.location_score * 0.2 +
    scores.quality_score * 0.15 +
    scores.on_time_delivery_score * 0.1

  return Math.round(weighted)
}

/**
 * Estimated Savings:
 * Compares #1 ranked vendor vs #2 ranked vendor price.
 * (vendor[1].unit_price - vendor[0].unit_price) * quantity.
 * Only returned if savings > 0.
 */
export function estimateSavings(
  rankedVendors: Array<{ unit_price: number }>,
  quantity: number
): number | null {
  if (!rankedVendors || rankedVendors.length < 2) return null
  const savingsPerUnit = rankedVendors[1].unit_price - rankedVendors[0].unit_price
  if (savingsPerUnit <= 0) return null
  return Math.round(savingsPerUnit * quantity * 100) / 100
}
