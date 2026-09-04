import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Test connection by querying a simple table
    // First try to list tables via a simple query
    const { data: materials, error: matError } = await supabase
      .from('material_master')
      .select('material_id')
      .limit(1)

    if (matError) {
      // Table might not exist yet — that's OK, connection still works
      // Check if it's a connection error vs table-not-found
      const isTableMissing = matError.message.includes('relation') 
        || matError.code === '42P01'
        || matError.message.includes('schema cache')
        || matError.message.includes('does not exist')

      if (isTableMissing) {
        return NextResponse.json({
          data: {
            status: 'connected',
            database: 'reachable',
            tables_created: false,
            message: 'Supabase connected but tables not yet created. Run schema.sql first.',
          },
          error: null,
        })
      }

      return NextResponse.json({
        data: null,
        error: {
          code: 'SUPABASE_ERROR',
          message: `Database error: ${matError.message}`,
        },
      }, { status: 500 })
    }

    // If we got here, tables exist — count rows in each table
    const tables = [
      'material_master',
      'plant_master',
      'plant_material_mapping',
      'vendor_master',
      'purchase_requisitions',
      'inventory',
      'demand_forecast',
      'purchase_orders',
      'ai_pr_analysis',
      'notifications',
    ]

    const counts: Record<string, number> = {}
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        counts[table] = -1 // Table might not exist
      } else {
        counts[table] = count ?? 0
      }
    }

    const { data: samplePlants } = await supabase.from('plant_master').select('plant_id, plant_name').limit(3)

    return NextResponse.json({
      data: {
        status: 'ok',
        database: 'connected',
        supabase_host: process.env.NEXT_PUBLIC_SUPABASE_URL,
        tables_created: true,
        sample_plants: samplePlants,
        table_counts: counts,
        timestamp: new Date().toISOString(),
      },
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      data: null,
      error: {
        code: 'CONNECTION_ERROR',
        message,
      },
    }, { status: 500 })
  }
}
