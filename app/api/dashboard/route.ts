import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const requestor_email = searchParams.get('requestor_email')
    const plant_id = searchParams.get('plant_id')

    // 1. Fetch materials
    const { data: materials, error: materialsError } = await supabase
      .from('material_master')
      .select('material_id, material_name, material_group, unit_of_measure')
      .eq('is_active', true)
    
    if (materialsError) throw materialsError

    // 2. Fetch plants
    const { data: plants, error: plantsError } = await supabase
      .from('plant_master')
      .select('plant_id, plant_name, location')
      .eq('is_active', true)

    if (plantsError) throw plantsError

    // 3. Fetch inventory with joined data
    // To keep it simple, we'll fetch inventory, forecasts, and POs separately and merge
    let inventoryQuery = supabase.from('inventory').select(`
      inventory_id, material_id, plant_id, available_stock, safety_stock, maximum_stock, last_updated
    `)
    if (plant_id) {
      inventoryQuery = inventoryQuery.eq('plant_id', plant_id)
    }
    const { data: inventoryData, error: inventoryError } = await inventoryQuery
    if (inventoryError) throw inventoryError

    const { data: forecastsData, error: forecastsError } = await supabase
      .from('demand_forecast')
      .select('material_id, plant_id, forecast_quantity')
      // Assuming we just want the current/nearest forecast. In a real app we'd filter by period.
      // For seed data, we just take the nearest one.
      .order('forecast_period', { ascending: true })
    if (forecastsError) throw forecastsError

    // Get open POs to calculate open_po_quantity
    const { data: openPOsData, error: openPOsError } = await supabase
      .from('purchase_orders')
      .select('material_id, quantity')
      .in('status', ['CREATED', 'SENT', 'CONFIRMED'])
    if (openPOsError) throw openPOsError

    // Map material names, UOM, and plant names for inventory
    const materialMap = new Map(materials.map(m => [m.material_id, m.material_name]))
    const uomMap = new Map(materials.map(m => [m.material_id, m.unit_of_measure]))
    const plantMap = new Map(plants.map(p => [p.plant_id, p.plant_name]))

    const inventory = inventoryData.map(inv => {
      // Find matching forecast
      const forecast = forecastsData.find(f => f.material_id === inv.material_id && f.plant_id === inv.plant_id)
      const forecasted_demand = forecast ? Number(forecast.forecast_quantity) : 0
      
      // Calculate open PO quantity for this material
      const open_po_quantity = openPOsData
        .filter(po => po.material_id === inv.material_id)
        .reduce((sum, po) => sum + Number(po.quantity), 0)

      return {
        ...inv,
        material_name: materialMap.get(inv.material_id) || inv.material_id,
        unit_of_measure: uomMap.get(inv.material_id) || 'units',
        plant_name: plantMap.get(inv.plant_id) || inv.plant_id,
        forecasted_demand,
        usable_stock: Number(inv.available_stock) - forecasted_demand,
        open_po_quantity
      }
    })

    // 4. Fetch recent PRs
    let prsQuery = supabase.from('purchase_requisitions').select(`
      pr_id, pr_number, material_id, plant_id, quantity, required_date, status, created_at,
      ai_pr_analysis(analysis_id)
    `).order('created_at', { ascending: false }).limit(10)

    if (requestor_email) {
      prsQuery = prsQuery.or(`requestor_email.eq.${requestor_email},requestor_name.eq.Gagan Rachakonda`)
    }

    const { data: prsData, error: prsError } = await prsQuery
    if (prsError) throw prsError

    const recent_prs = prsData.map((pr: any) => ({
      pr_id: pr.pr_id,
      pr_number: pr.pr_number,
      material_name: materialMap.get(pr.material_id) || pr.material_id,
      plant_name: plantMap.get(pr.plant_id) || pr.plant_id,
      quantity: Number(pr.quantity),
      required_date: pr.required_date,
      status: pr.status,
      created_at: pr.created_at,
      has_analysis: pr.ai_pr_analysis && pr.ai_pr_analysis.length > 0
    }))

    // 5. Fetch recent POs
    const { data: posData, error: posError } = await supabase.from('purchase_orders').select(`
      po_id, po_number, pr_id, vendor_id, quantity, total_amount, expected_delivery_date, status,
      purchase_requisitions!inner(pr_number)
    `).order('created_at', { ascending: false }).limit(5)
    
    if (posError) throw posError

    // We don't have a vendor map yet, let's fetch vendor names
    const { data: vendors, error: vendorsError } = await supabase.from('vendor_master').select('vendor_id, vendor_name')
    if (vendorsError) throw vendorsError
    const vendorMap = new Map(vendors.map(v => [v.vendor_id, v.vendor_name]))

    const recent_pos = posData.map((po: any) => ({
      po_id: po.po_id,
      po_number: po.po_number,
      pr_number: po.purchase_requisitions?.pr_number || 'Unknown PR',
      vendor_name: vendorMap.get(po.vendor_id) || po.vendor_id,
      quantity: Number(po.quantity),
      total_amount: Number(po.total_amount),
      expected_delivery_date: po.expected_delivery_date,
      status: po.status
    }))

    return NextResponse.json({
      data: {
        materials,
        plants,
        inventory,
        recent_prs,
        recent_pos
      },
      error: null
    })

  } catch (err: any) {
    return NextResponse.json({
      data: null,
      error: { code: 'DASHBOARD_FETCH_ERROR', message: err.message || 'Failed to fetch dashboard data' }
    }, { status: 500 })
  }
}
