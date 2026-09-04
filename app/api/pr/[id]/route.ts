// PR Detail & Pipeline Trigger API Route
// Module 10 Implementation

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { runPRPipeline } from '@/lib/agents/orchestrator'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const prId = params.id

    // 1. Fetch PR details
    const { data: pr, error: prError } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('pr_id', prId)
      .maybeSingle()

    if (prError) {
      console.error('Database error fetching PR:', prError)
      return NextResponse.json(
        { data: null, error: { code: 'SUPABASE_ERROR', message: prError.message } },
        { status: 500 }
      )
    }

    if (!pr) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: `PR with ID ${prId} not found` } },
        { status: 404 }
      )
    }

    // 2. Fetch Material details
    const { data: material } = await supabase
      .from('material_master')
      .select('material_name, material_group, unit_of_measure')
      .eq('material_id', pr.material_id)
      .maybeSingle()

    // 3. Fetch Plant details
    const { data: plant } = await supabase
      .from('plant_master')
      .select('plant_name, location')
      .eq('plant_id', pr.plant_id)
      .maybeSingle()

    // 4. Fetch AI Analysis record
    const { data: analysis } = await supabase
      .from('ai_pr_analysis')
      .select('*')
      .eq('pr_id', prId)
      .maybeSingle()

    // 5. Fetch PO record if any
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('pr_id', prId)
      .maybeSingle()

    let vendorName = null
    if (po?.vendor_id && po?.material_id) {
      const { data: vendor } = await supabase
        .from('vendor_master')
        .select('vendor_name')
        .eq('vendor_id', po.vendor_id)
        .eq('material_id', po.material_id)
        .maybeSingle()
      vendorName = vendor?.vendor_name || po.vendor_id
    }

    const responseData = {
      pr: {
        ...pr,
        material_name: material?.material_name || pr.material_id,
        material_group: material?.material_group || 'GENERAL',
        unit_of_measure: material?.unit_of_measure || 'EA',
        plant_name: plant?.plant_name || pr.plant_id,
        plant_location: plant?.location || '',
      },
      analysis: analysis || null,
      purchase_order: po
        ? {
            ...po,
            vendor_name: vendorName,
          }
        : null,
    }

    return NextResponse.json({ data: responseData, error: null }, { status: 200 })
  } catch (err: any) {
    console.error('Error in GET /api/pr/[id]:', err)
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prId = params.id
    console.log(`Triggering AI Pipeline execution for PR ${prId}...`)

    const result = await runPRPipeline(prId)

    return NextResponse.json(
      {
        data: {
          pr_id: prId,
          status: result.pr_status,
          analysis: result.analysis,
          created_po: result.created_po,
          message: 'AI pipeline completed successfully',
        },
        error: null,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error(`Pipeline execution failed for PR ${params.id}:`, err)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'PIPELINE_ERROR',
          message: err.message || 'Pipeline execution failed',
        },
      },
      { status: 500 }
    )
  }
}
