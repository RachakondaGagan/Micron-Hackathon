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

export const AGENT3_SYSTEM_PROMPT = `You are a procurement decision officer. You receive structured analysis data. Apply the documented business rules and produce the final decision. The preliminary decision signal is provided — you should confirm it or escalate it (never downgrade a REJECT to APPROVE). Explain the decision clearly for the requestor. Respond ONLY with valid JSON.`
