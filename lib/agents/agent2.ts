// Agent 2 — Vendor Sourcing Analysis
// Module 7 Implementation

import type { PurchaseRequisition, InventoryResult, SourcingResult, VendorMaster } from '@/types'
import {
  calculatePriceScore,
  calculateLeadTimeScore,
  calculateLocationScore,
  calculateQualityScore,
  calculateOnTimeDeliveryScore,
  calculateTotalVendorScore,
  estimateSavings,
} from '@/lib/scoring/agent2-scoring'
import { getGroqClient, GROQ_MODEL, GROQ_TEMPERATURE, GROQ_MAX_TOKENS } from '@/lib/groq'
import { AGENT2_SYSTEM_PROMPT, buildAgent2UserPrompt } from '@/lib/agents/prompts'
import { SourcingResultSchema } from '@/lib/validation/agent-output-validation'

export async function runAgent2(
  pr: PurchaseRequisition,
  eligibleVendors: VendorMaster[],
  inventoryResult: InventoryResult,
  plantLocation: string
): Promise<SourcingResult> {
  // 1. Edge Case: No active eligible vendors found
  if (!eligibleVendors || eligibleVendors.length === 0) {
    return {
      recommended_vendor_id: '',
      recommended_vendor_name: '',
      ranked_vendors: [],
      estimated_savings: null,
      sourcing_risks: ['No active suppliers found for SKU in ERP vendor master.'],
      explanation: `No active qualified suppliers were found in the vendor master for material ${pr.material_id}. Sourcing cannot proceed automatically; manual procurement review is required.`,
      trade_off_summary: 'Unable to evaluate trade-offs due to lack of eligible vendor contracts.',
      no_vendors_found: true,
    }
  }

  // 2. Pre-compute min/max arrays for normalization
  const allPrices = eligibleVendors.map((v) => Number(v.unit_price))
  const allLeadTimes = eligibleVendors.map((v) => Number(v.lead_time_days))

  // 3. Compute deterministic scores for each vendor
  const scoredVendors = eligibleVendors.map((v) => {
    const price_score = calculatePriceScore(Number(v.unit_price), allPrices)
    const lead_time_score = calculateLeadTimeScore(Number(v.lead_time_days), allLeadTimes)
    const location_score = calculateLocationScore(v.location, plantLocation)
    const quality_score = calculateQualityScore(Number(v.quality_rating))
    const on_time_delivery_score = calculateOnTimeDeliveryScore(Number(v.on_time_delivery))

    const total_score = calculateTotalVendorScore({
      price_score,
      lead_time_score,
      location_score,
      quality_score,
      on_time_delivery_score,
    })

    return {
      vendor_id: v.vendor_id,
      vendor_name: v.vendor_name,
      unit_price: Number(v.unit_price),
      lead_time_days: Number(v.lead_time_days),
      vendor_location: v.location,
      quality_rating: Number(v.quality_rating),
      on_time_delivery: Number(v.on_time_delivery),
      price_score,
      lead_time_score,
      location_score,
      quality_score,
      on_time_delivery_score,
      total_score,
    }
  })

  // 4. Sort descending by total_score; break ties by lower price, then lower lead time
  scoredVendors.sort((a, b) => {
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score
    }
    if (a.unit_price !== b.unit_price) {
      return a.unit_price - b.unit_price
    }
    return a.lead_time_days - b.lead_time_days
  })

  // Assign rank numbers (1-indexed)
  const ranked_vendors = scoredVendors.map((v, index) => ({
    rank: index + 1,
    ...v,
  }))

  // 5. Calculate estimated savings
  const estimated_savings = estimateSavings(ranked_vendors, pr.quantity)

  const topVendor = ranked_vendors[0]
  const isSoleSource = ranked_vendors.length === 1

  // 6. Deterministic fallback in case Groq is unavailable
  const fallbackRisks: string[] = []
  if (isSoleSource) {
    fallbackRisks.push('Single-source dependency: no secondary vendor available.')
  }
  if (topVendor.lead_time_days > 14) {
    fallbackRisks.push(`Extended lead time (${topVendor.lead_time_days} days) may impact required delivery schedule.`)
  }
  if (topVendor.location_score === 0) {
    fallbackRisks.push(`Supplier is located outside plant region (${topVendor.vendor_location}); higher freight risk.`)
  }
  if (topVendor.on_time_delivery < 90) {
    fallbackRisks.push(`On-time delivery performance (${topVendor.on_time_delivery}%) is below 90% benchmark.`)
  }
  if (fallbackRisks.length === 0) {
    fallbackRisks.push('Low overall operational risk; vendor meets all performance criteria.')
  }

  const fallbackResult: SourcingResult = {
    recommended_vendor_id: topVendor.vendor_id,
    recommended_vendor_name: topVendor.vendor_name,
    ranked_vendors,
    estimated_savings,
    sourcing_risks: fallbackRisks,
    explanation: isSoleSource
      ? `Recommended ${topVendor.vendor_name} as the sole qualified vendor for material ${pr.material_id} ($${topVendor.unit_price}/unit, ${topVendor.lead_time_days}d lead time).`
      : `Recommended ${topVendor.vendor_name} with highest score (${topVendor.total_score}/100). Offers optimal balance between unit price ($${topVendor.unit_price}) and delivery capabilities.`,
    trade_off_summary: isSoleSource
      ? 'Sole-source procurement; no alternative suppliers available for comparison.'
      : ranked_vendors[1]
      ? `Selecting ${topVendor.vendor_name} over #${ranked_vendors[1].rank} ${ranked_vendors[1].vendor_name} (${ranked_vendors[1].total_score}/100) balances total cost and fulfillment risk.`
      : 'Primary supplier selected based on highest composite score.',
    no_vendors_found: false,
  }

  // 7. Groq contextual reasoning
  try {
    const groq = getGroqClient()
    const prompt = buildAgent2UserPrompt({
      pr: {
        material_id: pr.material_id,
        plant_id: pr.plant_id,
        plant_location: plantLocation,
        quantity: pr.quantity,
        required_date: pr.required_date,
      },
      ranked_vendors,
      estimated_savings,
      inventory_status: inventoryResult.status,
    })

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AGENT2_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return fallbackResult

    const parsed = JSON.parse(content)
    const combined = {
      ...parsed,
      ranked_vendors,
      recommended_vendor_id: topVendor.vendor_id,
      recommended_vendor_name: topVendor.vendor_name,
      estimated_savings,
      no_vendors_found: false,
    }

    const validation = SourcingResultSchema.safeParse(combined)
    if (validation.success) {
      return validation.data
    } else {
      console.warn('Agent 2 LLM output failed schema validation, using fallback:', validation.error)
      return fallbackResult
    }
  } catch (err) {
    console.warn('Agent 2 Groq API call failed or timed out, using fallback:', err)
    return fallbackResult
  }
}
