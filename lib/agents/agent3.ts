// Agent 3 — Final Decision
// Module 8 Implementation

import type {
  PurchaseRequisition,
  DuplicateResult,
  InventoryResult,
  SourcingResult,
  DecisionResult,
} from '@/types'
import { computePreliminaryDecision } from '@/lib/scoring/agent3-decision'
import { getGroqClient, GROQ_MODEL, GROQ_TEMPERATURE, GROQ_MAX_TOKENS } from '@/lib/groq'
import { AGENT3_SYSTEM_PROMPT, buildAgent3UserPrompt } from '@/lib/agents/prompts'
import { DecisionResultSchema } from '@/lib/validation/agent-output-validation'
import { createPurchaseOrder } from '@/lib/orders/po'

export async function runAgent3(
  pr: PurchaseRequisition,
  duplicateResult: DuplicateResult,
  inventoryResult: InventoryResult,
  sourcingResult: SourcingResult | null,
  matchedPRStatus?: string,
  options?: {
    autoCreatePO?: boolean
    customSupabaseClient?: any
  }
): Promise<DecisionResult & { created_po?: any }> {
  // 1. Calculate deterministic preliminary decision signal
  const preliminary = computePreliminaryDecision(
    duplicateResult,
    inventoryResult,
    sourcingResult,
    matchedPRStatus
  )

  // 2. Build deterministic fallback response
  const fallbackEvidence: string[] = []
  if (duplicateResult.duplicate_detected) {
    fallbackEvidence.push(
      `High similarity (${duplicateResult.overall_similarity_score}%) with ${duplicateResult.matched_pr_number || 'prior PR'}`
    )
  }
  fallbackEvidence.push(
    `Inventory status: ${inventoryResult.status} (usable stock: ${inventoryResult.usable_stock})`
  )
  if (sourcingResult && !sourcingResult.no_vendors_found && sourcingResult.recommended_vendor_name) {
    fallbackEvidence.push(
      `Top recommended vendor: ${sourcingResult.recommended_vendor_name} (Rank 1)`
    )
  } else if (sourcingResult?.no_vendors_found) {
    fallbackEvidence.push('No qualified vendor contracts exist in ERP for material SKU')
  }

  let fallbackReason: string
  let fallbackNextStep: string

  if (preliminary.decision === 'REJECT') {
    fallbackReason = `Requisition rejected. Duplicate detection identified a ${duplicateResult.overall_similarity_score}% match with existing requisition ${duplicateResult.matched_pr_number || ''} which is already in progress/completed. Duplicate purchase orders are disallowed.`
    fallbackNextStep = `Cancel requisition or track existing requisition ${duplicateResult.matched_pr_number || ''}.`
  } else if (preliminary.decision === 'REVIEW') {
    if (sourcingResult?.no_vendors_found) {
      fallbackReason = `Requisition requires manual procurement review. Inventory is insufficient to fulfill order and no active supplier agreements exist in the vendor master.`
      fallbackNextStep = 'Route to Sourcing Manager for supplier onboarding or RFQ.'
    } else if (duplicateResult.duplicate_detected) {
      fallbackReason = `Requisition requires review due to potential conflict with pending requisition ${duplicateResult.matched_pr_number || ''} (${duplicateResult.overall_similarity_score}% similarity).`
      fallbackNextStep = 'Route to Procurement Operations queue to verify if order is additive or duplicate.'
    } else {
      fallbackReason = `Requisition flagged for buyer review due to inventory buffer risks.`
      fallbackNextStep = 'Route to Senior Buyer review queue.'
    }
  } else {
    // APPROVE
    if (inventoryResult.status === 'SUFFICIENT') {
      fallbackReason = `Requisition approved for internal fulfillment. Available plant stock is sufficient to satisfy the requested quantity without breaching safety stock buffers.`
      fallbackNextStep = 'Issue transfer order from internal plant inventory.'
    } else {
      fallbackReason = `Requisition approved for external procurement. Recommended supplier ${sourcingResult?.recommended_vendor_name || 'preferred vendor'} selected based on composite evaluation score.`
      fallbackNextStep = `Generate Purchase Order for ${sourcingResult?.recommended_vendor_name || 'vendor'} and dispatch confirmation.`
    }
  }

  let finalDecisionResult: DecisionResult = {
    decision: preliminary.decision,
    reason: fallbackReason,
    risk_level: preliminary.risk_level,
    key_evidence: fallbackEvidence,
    recommended_next_step: fallbackNextStep,
  }

  // 3. Invoke Groq LLM for contextual reasoning
  try {
    const groq = getGroqClient()
    const prompt = buildAgent3UserPrompt({
      pr: {
        pr_id: pr.pr_id,
        pr_number: pr.pr_number,
        material_id: pr.material_id,
        plant_id: pr.plant_id,
        quantity: pr.quantity,
        required_date: pr.required_date,
        requestor_name: pr.requestor_name,
      },
      preliminary_decision: preliminary,
      duplicate_analysis: {
        duplicate_detected: duplicateResult.duplicate_detected,
        overall_similarity_score: duplicateResult.overall_similarity_score,
        confidence: duplicateResult.confidence,
        matched_pr_number: duplicateResult.matched_pr_number,
        matched_pr_status: matchedPRStatus,
      },
      inventory_analysis: {
        status: inventoryResult.status,
        usable_stock: inventoryResult.usable_stock,
        remaining_after_pr: inventoryResult.remaining_after_pr,
        safety_stock: inventoryResult.safety_stock,
      },
      sourcing_analysis: sourcingResult
        ? {
            recommended_vendor_name: sourcingResult.recommended_vendor_name,
            recommended_vendor_id: sourcingResult.recommended_vendor_id,
            estimated_savings: sourcingResult.estimated_savings,
            no_vendors_found: sourcingResult.no_vendors_found,
          }
        : null,
    })

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AGENT3_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content)
      const validation = DecisionResultSchema.safeParse(parsed)

      if (validation.success) {
        finalDecisionResult = validation.data

        // 4. CRITICAL SAFETY INVARIANT:
        // LLM can NEVER downgrade a deterministic REJECT to an APPROVE
        if (preliminary.decision === 'REJECT' && finalDecisionResult.decision === 'APPROVE') {
          console.warn('Safety violation: LLM attempted to downgrade REJECT to APPROVE. Overriding to REJECT.')
          finalDecisionResult.decision = 'REJECT'
          finalDecisionResult.risk_level = 'HIGH'
          finalDecisionResult.reason = fallbackReason
        }
      } else {
        console.warn('Agent 3 LLM output failed schema validation, using fallback:', validation.error)
      }
    }
  } catch (err) {
    console.warn('Agent 3 Groq API call failed or timed out, using fallback:', err)
  }

  // 5. Automatic PO Creation on APPROVE when sourcing was needed
  let created_po: any = undefined
  if (
    finalDecisionResult.decision === 'APPROVE' &&
    inventoryResult.status !== 'SUFFICIENT' &&
    sourcingResult &&
    !sourcingResult.no_vendors_found &&
    options?.autoCreatePO
  ) {
    try {
      const topVendor = sourcingResult.ranked_vendors[0]
      if (topVendor) {
        created_po = await createPurchaseOrder({
          prId: pr.pr_id,
          vendorId: topVendor.vendor_id,
          materialId: pr.material_id,
          quantity: pr.quantity,
          unitPrice: topVendor.unit_price,
          expectedDeliveryDate: pr.required_date,
          customSupabaseClient: options.customSupabaseClient,
        })
      }
    } catch (poErr) {
      console.error('Failed to auto-create PO during Agent 3 decision:', poErr)
    }
  }

  return {
    ...finalDecisionResult,
    created_po,
  }
}
