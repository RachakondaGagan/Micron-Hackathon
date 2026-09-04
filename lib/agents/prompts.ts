// Centralized Agent Prompts
// Per NFR-13: Agent prompts are centralized in a prompts file

export const AGENT1_SYSTEM_PROMPT = `You are a procurement duplicate detection assistant. You receive pre-calculated similarity scores and PR data. Your job is to explain WHY the PRs are similar or different and identify the most important evidence. You must respond ONLY with valid JSON matching the required schema. Do not invent any data values — all scores are provided to you.`

export function buildAgent1UserPrompt(data: {
  newPR: {
    pr_id: string
    pr_number: string
    material_id: string
    material_name?: string
    plant_id: string
    plant_name?: string
    quantity: number
    required_date: string
    requestor_name: string
    requestor_email: string
    created_at: string
  }
  bestMatchPR: {
    pr_id: string
    pr_number: string
    material_id: string
    material_name?: string
    plant_id: string
    plant_name?: string
    quantity: number
    required_date: string
    requestor_name: string
    requestor_email: string
    created_at: string
    status: string
  } | null
  kpis: {
    material_match: number
    plant_match: number
    quantity_similarity: number
    date_similarity: number
    requestor_match: number
    time_gap_score: number
    overall_similarity: number
  } | null
}): string {
  return `Analyze this purchase requisition against historical requisitions.

INPUT DATA:
${JSON.stringify(data, null, 2)}

Respond with a JSON object strictly conforming to this schema:
{
  "duplicate_detected": boolean,
  "overall_similarity_score": number, // exact overall_similarity provided
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "matched_pr_id": string | null,
  "matched_pr_number": string | null,
  "material_match_score": number,
  "plant_match_score": number,
  "quantity_similarity_score": number,
  "required_date_similarity_score": number,
  "requestor_match_score": number,
  "time_gap_score": number,
  "explanation": string, // 2-3 concise sentences explaining the finding
  "evidence": string[], // bullet-point list of evidence (max 5 items)
  "recommended_action": string // one clear sentence recommendation
}`
}

export const AGENT2_SYSTEM_PROMPT = `You are a procurement sourcing analyst. You receive pre-ranked vendor data with calculated scores. Your job is to explain the sourcing recommendation, identify trade-offs, and highlight any risks. All numerical values are provided — do not invent prices, lead times, or ratings. Respond ONLY with valid JSON.`

export function buildAgent2UserPrompt(data: {
  pr: {
    material_id: string
    plant_id: string
    plant_location: string
    quantity: number
    required_date: string
  }
  ranked_vendors: Array<{
    rank: number
    vendor_id: string
    vendor_name: string
    unit_price: number
    lead_time_days: number
    vendor_location: string
    quality_rating: number
    on_time_delivery: number
    price_score: number
    lead_time_score: number
    location_score: number
    quality_score: number
    on_time_delivery_score: number
    total_score: number
  }>
  estimated_savings: number | null
  inventory_status: string
}): string {
  return `Analyze the following procurement sourcing options and provide structured recommendation rationale.

INPUT DATA:
${JSON.stringify(data, null, 2)}

Respond strictly in JSON format matching this schema:
{
  "recommended_vendor_id": string, // ID of the rank 1 vendor
  "recommended_vendor_name": string, // Name of the rank 1 vendor
  "estimated_savings": number | null, // exact estimated_savings provided
  "sourcing_risks": string[], // list of 1-3 concrete sourcing or delivery risks
  "explanation": string, // 2-3 sentences explaining why this vendor is recommended based on scores
  "trade_off_summary": string // 1-2 sentences summarizing trade-offs (e.g. price vs speed or quality)
}`
}

export const AGENT3_SYSTEM_PROMPT = `You are a procurement decision officer. You receive structured analysis data. Apply the documented business rules and produce the final decision. The preliminary decision signal is provided — you should confirm it or escalate it (never downgrade a REJECT to APPROVE). Explain the decision clearly for the requestor. Respond ONLY with valid JSON.`

export function buildAgent3UserPrompt(data: {
  pr: {
    pr_id: string
    pr_number: string
    material_id: string
    plant_id: string
    quantity: number
    required_date: string
    requestor_name: string
  }
  preliminary_decision: {
    decision: 'APPROVE' | 'REVIEW' | 'REJECT'
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  duplicate_analysis: {
    duplicate_detected: boolean
    overall_similarity_score: number
    confidence: string
    matched_pr_number: string | null
    matched_pr_status?: string
  }
  inventory_analysis: {
    status: 'SUFFICIENT' | 'AT_RISK' | 'INSUFFICIENT'
    usable_stock: number
    remaining_after_pr: number
    safety_stock: number
  }
  sourcing_analysis: {
    recommended_vendor_name?: string
    recommended_vendor_id?: string
    estimated_savings?: number | null
    no_vendors_found?: boolean
  } | null
}): string {
  return `Review this procurement requisition analysis and finalize the decision.

INPUT ANALYSIS:
${JSON.stringify(data, null, 2)}

BUSINESS RULES SUMMARY:
- REJECT: Duplicate of an already APPROVED/COMPLETED PR (similarity >= 75%), or invalid quantity.
- REVIEW: Potential duplicate of a pending PR (similarity >= 75%), or inventory deficit with high similarity, or no vendors available.
- APPROVE: Inventory sufficient, or inventory deficit with a recommended qualified vendor available.

Respond strictly in JSON format matching this schema:
{
  "decision": "APPROVE" | "REVIEW" | "REJECT",
  "reason": string, // Clear explanation of the decision for the requestor
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "key_evidence": string[], // 2-4 bullet points summarizing the decisive factors
  "recommended_next_step": string // 1 sentence describing next action (e.g. Issue PO, routing to human reviewer, etc.)
}`
}
