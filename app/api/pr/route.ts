import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CreatePRSchema } from '@/lib/validation/pr-validation'

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
    const { data: mapping } = await supabase.from('plant_material_mapping')
      .select('mapping_id')
      .eq('material_id', material_id)
      .eq('plant_id', plant_id)
      .single()
    
    if (!mapping) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_MAPPING', message: 'Material is not mapped to this plant' } }, { status: 400 })
    }

    // 3. Insert PR (Trigger generate_pr_number() will run automatically on insert due to DB trigger)
    const { data: newPR, error: insertError } = await supabase
      .from('purchase_requisitions')
      .insert({
        material_id,
        plant_id,
        quantity,
        required_date,
        requestor_name,
        requestor_email,
        planner_name: planner_name || 'Bhargav',
        planner_email: planner_email || 'buddarajubhargavavarma@gmail.com',
        status: 'CREATED'
      })
      .select('pr_id, pr_number, status')
      .single()

    if (insertError) {
      console.error('Insert Error:', insertError)
      return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: 'Failed to create PR' } }, { status: 500 })
    }

    // In Module 12 we will trigger the pipeline here via an edge function or background worker
    // For now, just return the PR

    return NextResponse.json({ data: newPR, error: null }, { status: 201 })
  } catch (err: any) {
    console.error('PR Creation Error:', err)
    return NextResponse.json({
      data: null,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }
    }, { status: 500 })
  }
}
