import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CreatePRSchema } from '@/lib/validation/pr-validation'
import { runPRPipeline } from '@/lib/agents/orchestrator'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const requestor_email = searchParams.get('requestor_email')
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0

    let query = supabase
      .from('purchase_requisitions')
      .select(`
        pr_id,
        pr_number,
        material_id,
        plant_id,
        quantity,
        required_date,
        status,
        created_at,
        material_master (material_name),
        plant_master (plant_name),
        ai_pr_analysis (decision, risk_level)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (requestor_email) {
      query = query.eq('requestor_email', requestor_email)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: prsRaw, count, error } = await query

    if (error) {
      console.error('Error fetching PR list:', error)
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
    }

    const prs = (prsRaw || []).map((row: any) => {
      const materialName = row.material_master?.material_name || row.material_id
      const plantName = row.plant_master?.plant_name || row.plant_id
      const analysis = Array.isArray(row.ai_pr_analysis) ? row.ai_pr_analysis[0] : row.ai_pr_analysis

      return {
        pr_id: row.pr_id,
        pr_number: row.pr_number,
        material_name: materialName,
        plant_name: plantName,
        quantity: Number(row.quantity),
        required_date: row.required_date,
        status: row.status,
        decision: analysis?.decision || null,
        risk_level: analysis?.risk_level || null,
        created_at: row.created_at,
      }
    })

    return NextResponse.json({
      data: {
        prs,
        total: count || prs.length,
      },
      error: null,
    }, { status: 200 })
  } catch (err: any) {
    console.error('PR List Error:', err)
    return NextResponse.json({
      data: null,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // 1. Validate Input
    const result = CreatePRSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message }
      }, { status: 400 })
    }

    const { material_id, plant_id, quantity, required_date, requestor_name, requestor_email, planner_name, planner_email } = result.data

    // 2. Validate Material & Plant exist
    const { data: material } = await supabase.from('material_master').select('material_id').eq('material_id', material_id).single()
    if (!material) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_MATERIAL', message: 'Material not found or inactive' } }, { status: 400 })
    }

    const { data: plant } = await supabase.from('plant_master').select('plant_id').eq('plant_id', plant_id).single()
    if (!plant) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_PLANT', message: 'Plant not found or inactive' } }, { status: 400 })
    }

    // Check mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('plant_material_mapping')
      .select('plant_id, material_id')
      .eq('material_id', material_id)
      .eq('plant_id', plant_id)
      .eq('is_active', true)
      .maybeSingle()
    
    if (mappingError || !mapping) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_MAPPING', message: 'Material is not mapped to this plant' } }, { status: 400 })
    }

    // 3. Generate sequential PR number via database RPC
    let prNumber = `PR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
    try {
      const { data: generatedPRNum, error: rpcError } = await supabase.rpc('generate_pr_number')
      if (!rpcError && generatedPRNum) {
        prNumber = generatedPRNum
      }
    } catch (err) {
      console.warn('RPC generate_pr_number failed, using fallback format:', err)
    }

    const { data: newPR, error: insertError } = await supabase
      .from('purchase_requisitions')
      .insert({
        pr_number: prNumber,
        material_id,
        plant_id,
        quantity,
        required_date,
        requestor_name,
        requestor_email,
        planner_name: planner_name || null,
        planner_email: planner_email || null,
        status: 'CREATED'
      })
      .select('pr_id, pr_number, status')
      .single()

    if (insertError) {
      console.error('Insert Error:', insertError)
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: 'Failed to create PR' } }, { status: 500 })
    }

    // 4. Trigger the AI Pipeline asynchronously in background
    runPRPipeline(newPR.pr_id).catch((pipeErr) => {
      console.error(`Background pipeline execution failed for PR ${newPR.pr_id}:`, pipeErr)
    })

    return NextResponse.json({
      data: {
        pr_id: newPR.pr_id,
        pr_number: newPR.pr_number,
        status: newPR.status,
        pipeline_status: 'PROCESSING',
        message: 'PR created and analysis pipeline started'
      },
      error: null
    }, { status: 201 })
  } catch (err: any) {
    console.error('PR Creation Error:', err)
    return NextResponse.json({
      data: null,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }
    }, { status: 500 })
  }
}
