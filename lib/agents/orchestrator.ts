// PR Pipeline Orchestrator
// Wires all agents into a sequential autonomous pipeline
// Module 10 & 12 Implementation

import { createServerClient } from '@/lib/supabase'
import { runAgent1 } from '@/lib/agents/agent1'
import { runInventoryCheck } from '@/lib/scoring/inventory-check'
import { runAgent2 } from '@/lib/agents/agent2'
import { runAgent3 } from '@/lib/agents/agent3'
import { runAgent4 } from '@/lib/agents/agent4'
import type { PurchaseRequisition, VendorMaster } from '@/types'

export interface PipelineRunResult {
  success: boolean
  analysis: any
  pr_status: string
  created_po?: any
}

export async function runPRPipeline(prId: string): Promise<PipelineRunResult> {
  const supabase = createServerClient()

  // 1. Fetch PR details
  const { data: pr, error: prError } = await supabase
    .from('purchase_requisitions')
    .select('*')
    .eq('pr_id', prId)
    .single()

  if (prError || !pr) {
    throw new Error(`PR ${prId} not found: ${prError?.message}`)
  }

  // 2. Fetch Plant location
  const { data: plant } = await supabase
    .from('plant_master')
    .select('location')
    .eq('plant_id', pr.plant_id)
    .single()

  const plantLocation = plant?.location || ''

  // 3. Mark PR as UNDER_REVIEW while pipeline is processing
  await supabase
    .from('purchase_requisitions')
    .update({ status: 'UNDER_REVIEW', updated_at: new Date().toISOString() })
    .eq('pr_id', prId)

  try {
    // 4. Fetch historical PRs (last 7 days) for Agent 1 duplicate check
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: historicalPRsRaw } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .gte('created_at', sevenDaysAgo)
      .neq('pr_id', prId)

    const historicalPRs: PurchaseRequisition[] = historicalPRsRaw || []

    // 5. Stage 1: Agent 1 (Duplicate Detection)
    const duplicateResult = await runAgent1(pr, historicalPRs)

    // Check matched PR status if duplicate detected
    let matchedPRStatus: string | undefined
    if (duplicateResult.matched_pr_id) {
      const matched = historicalPRs.find((h) => h.pr_id === duplicateResult.matched_pr_id)
      matchedPRStatus = matched?.status
    }

    // 6. Stage 2: Inventory Check (Deterministic)
    const inventoryResult = await runInventoryCheck(pr.material_id, pr.plant_id, Number(pr.quantity))

    // 7. Stage 3: Agent 2 (Vendor Sourcing - if inventory not SUFFICIENT)
    let sourcingResult = null
    if (inventoryResult.status !== 'SUFFICIENT') {
      const { data: vendorsRaw } = await supabase
        .from('vendor_master')
        .select('*')
        .eq('material_id', pr.material_id)
        .eq('is_active', true)

      const eligibleVendors: VendorMaster[] = vendorsRaw || []
      sourcingResult = await runAgent2(pr, eligibleVendors, inventoryResult, plantLocation)
    }

    // 8. Stage 4: Agent 3 (Final Decision + PO Creation)
    const decisionResultWithPO = await runAgent3(
      pr,
      duplicateResult,
      inventoryResult,
      sourcingResult,
      matchedPRStatus,
      { autoCreatePO: true }
    )

    // 9. Stage 5: Agent 4 (Notifications & Resend Dispatch)
    await runAgent4(pr, decisionResultWithPO)

    // 10. Upsert into ai_pr_analysis table
    const analysisPayload = {
      pr_id: pr.pr_id,
      duplicate_result: duplicateResult,
      inventory_result: inventoryResult,
      sourcing_result: sourcingResult,
      decision: decisionResultWithPO.decision,
      decision_reason: decisionResultWithPO.reason,
      risk_level: decisionResultWithPO.risk_level,
      estimated_savings: sourcingResult?.estimated_savings ?? null,
      pipeline_error: null,
      updated_at: new Date().toISOString(),
    }

    const { data: upsertedAnalysis, error: upsertError } = await supabase
      .from('ai_pr_analysis')
      .upsert(analysisPayload, { onConflict: 'pr_id' })
      .select('*')
      .single()

    if (upsertError) {
      console.error('Error upserting ai_pr_analysis:', upsertError)
    }

    // 11. Determine Final PR Status
    let finalStatus = 'UNDER_REVIEW'
    if (decisionResultWithPO.decision === 'APPROVE') {
      finalStatus = decisionResultWithPO.created_po ? 'PO_CREATED' : 'APPROVED'
    } else if (decisionResultWithPO.decision === 'REJECT') {
      finalStatus = 'REJECTED'
    } else {
      // REVIEW
      finalStatus = 'UNDER_REVIEW'
    }

    await supabase
      .from('purchase_requisitions')
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq('pr_id', prId)

    return {
      success: true,
      analysis: upsertedAnalysis || analysisPayload,
      pr_status: finalStatus,
      created_po: decisionResultWithPO.created_po,
    }
  } catch (error: any) {
    console.error(`Pipeline execution failed for PR ${prId}:`, error)

    try {
      await supabase
        .from('ai_pr_analysis')
        .upsert(
          {
            pr_id: pr.pr_id,
            pipeline_error: error.message || 'Unknown pipeline execution error',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'pr_id' }
        )
    } catch (e: any) {
      console.warn('Failed to record pipeline error:', e)
    }

    throw error
  }
}
