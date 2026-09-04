// Agent 1 — PR Matching / Validation
// Module 5 Implementation

import type { PurchaseRequisition, DuplicateResult } from '@/types'
import {
  calculateMaterialMatch,
  calculatePlantMatch,
  calculateQuantitySimilarity,
  calculateDateSimilarity,
  calculateRequestorMatch,
  calculateTimeGapScore,
  calculateOverallSimilarity,
} from '@/lib/scoring/agent1-scoring'
import { getGroqClient, GROQ_MODEL, GROQ_TEMPERATURE, GROQ_MAX_TOKENS } from '@/lib/groq'
import { AGENT1_SYSTEM_PROMPT, buildAgent1UserPrompt } from '@/lib/agents/prompts'
import { DuplicateResultSchema } from '@/lib/validation/agent-output-validation'

export async function runAgent1(
  newPR: PurchaseRequisition,
  historicalPRs: PurchaseRequisition[]
): Promise<DuplicateResult> {
  // 1. Filter out self if present
  const candidates = historicalPRs.filter((pr) => pr.pr_id !== newPR.pr_id)

  // 2. Edge Case: No historical PRs
  if (candidates.length === 0) {
    return {
      duplicate_detected: false,
      overall_similarity_score: 0,
      confidence: 'LOW',
      matched_pr_id: null,
      matched_pr_number: null,
      material_match_score: 0,
      plant_match_score: 0,
      quantity_similarity_score: 0,
      required_date_similarity_score: 0,
      requestor_match_score: 0,
      time_gap_score: 0,
      explanation: 'No historical PRs found within the comparison window.',
      evidence: ['No previous purchase requisitions available for comparison'],
      recommended_action: 'Proceed with standard requisition pipeline.',
    }
  }

  // 3. Compute KPI scores for each historical PR and select best match
  let bestMatch: PurchaseRequisition | null = null
  let bestScores = {
    material_match: 0,
    plant_match: 0,
    quantity_similarity: 0,
    date_similarity: 0,
    requestor_match: 0,
    time_gap_score: 0,
    overall_similarity: -1,
  }

  for (const hist of candidates) {
    const material_match = calculateMaterialMatch(newPR.material_id, hist.material_id)
    const plant_match = calculatePlantMatch(newPR.plant_id, hist.plant_id)
    const quantity_similarity = calculateQuantitySimilarity(newPR.quantity, hist.quantity)
    const date_similarity = calculateDateSimilarity(newPR.required_date, hist.required_date)
    const requestor_match = calculateRequestorMatch(newPR.requestor_email, hist.requestor_email)
    const time_gap_score = calculateTimeGapScore(newPR.created_at, hist.created_at)

    const overall_similarity = calculateOverallSimilarity({
      material_match,
      plant_match,
      quantity_similarity,
      date_similarity,
      requestor_match,
      time_gap_score,
    })

    if (overall_similarity > bestScores.overall_similarity) {
      bestMatch = hist
      bestScores = {
        material_match,
        plant_match,
        quantity_similarity,
        date_similarity,
        requestor_match,
        time_gap_score,
        overall_similarity,
      }
    }
  }

  const overall = bestScores.overall_similarity
  const isDuplicate = overall >= 75
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    overall >= 75 ? 'HIGH' : overall >= 50 ? 'MEDIUM' : 'LOW'

  // Construct deterministic fallback evidence & explanation
  const evidenceList: string[] = []
  if (bestScores.material_match === 100) evidenceList.push(`Exact material match (${newPR.material_id})`)
  else evidenceList.push(`Different material (${newPR.material_id} vs ${bestMatch?.material_id})`)

  if (bestScores.plant_match === 100) evidenceList.push(`Exact plant destination match (${newPR.plant_id})`)
  if (bestScores.quantity_similarity >= 80) evidenceList.push(`Close quantity similarity (${bestScores.quantity_similarity}%)`)
  if (bestScores.time_gap_score >= 80) evidenceList.push(`Created in close temporal proximity (${bestScores.time_gap_score}% score)`)
  if (bestScores.requestor_match === 100) evidenceList.push(`Same requestor (${newPR.requestor_email})`)

  const fallbackResult: DuplicateResult = {
    duplicate_detected: isDuplicate,
    overall_similarity_score: overall,
    confidence,
    matched_pr_id: bestMatch?.pr_id ?? null,
    matched_pr_number: bestMatch?.pr_number ?? null,
    material_match_score: bestScores.material_match,
    plant_match_score: bestScores.plant_match,
    quantity_similarity_score: bestScores.quantity_similarity,
    required_date_similarity_score: bestScores.date_similarity,
    requestor_match_score: bestScores.requestor_match,
    time_gap_score: bestScores.time_gap_score,
    explanation: isDuplicate
      ? `Requisition closely matches historical requisition ${bestMatch?.pr_number} with an overall similarity of ${overall}%. Same material and plant were requested in close proximity.`
      : `Requisition evaluated against ${candidates.length} historical requisition(s). Highest similarity score was ${overall}% (${bestMatch?.pr_number}), below duplicate threshold.`,
    evidence: evidenceList,
    recommended_action: isDuplicate
      ? `Flag for review: potential duplicate of ${bestMatch?.pr_number}. Verify before issuing duplicate PO.`
      : overall >= 50
      ? `Proceed with caution: moderate similarity with ${bestMatch?.pr_number}.`
      : 'Proceed with standard requisition pipeline.',
  }

  // 4. Call Groq for contextual explanation
  try {
    const groq = getGroqClient()
    const prompt = buildAgent1UserPrompt({
      newPR: {
        pr_id: newPR.pr_id,
        pr_number: newPR.pr_number,
        material_id: newPR.material_id,
        plant_id: newPR.plant_id,
        quantity: newPR.quantity,
        required_date: newPR.required_date,
        requestor_name: newPR.requestor_name,
        requestor_email: newPR.requestor_email,
        created_at: newPR.created_at,
      },
      bestMatchPR: bestMatch
        ? {
            pr_id: bestMatch.pr_id,
            pr_number: bestMatch.pr_number,
            material_id: bestMatch.material_id,
            plant_id: bestMatch.plant_id,
            quantity: bestMatch.quantity,
            required_date: bestMatch.required_date,
            requestor_name: bestMatch.requestor_name,
            requestor_email: bestMatch.requestor_email,
            created_at: bestMatch.created_at,
            status: bestMatch.status,
          }
        : null,
      kpis: bestScores,
    })

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AGENT1_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return fallbackResult

    const parsed = JSON.parse(content)
    const validation = DuplicateResultSchema.safeParse(parsed)

    if (validation.success) {
      // Return validated output, ensuring deterministic scores are strictly preserved
      return {
        ...validation.data,
        overall_similarity_score: overall,
        material_match_score: bestScores.material_match,
        plant_match_score: bestScores.plant_match,
        quantity_similarity_score: bestScores.quantity_similarity,
        required_date_similarity_score: bestScores.date_similarity,
        requestor_match_score: bestScores.requestor_match,
        time_gap_score: bestScores.time_gap_score,
        matched_pr_id: bestMatch?.pr_id ?? null,
        matched_pr_number: bestMatch?.pr_number ?? null,
      }
    } else {
      console.warn('Agent 1 LLM output failed schema validation, using fallback:', validation.error)
      return fallbackResult
    }
  } catch (err) {
    console.warn('Agent 1 Groq API call failed or timed out, using fallback:', err)
    return fallbackResult
  }
}
