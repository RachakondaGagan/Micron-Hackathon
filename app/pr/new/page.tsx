import { createServerClient } from '@/lib/supabase'
import { PRForm } from '@/components/pr/PRForm'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CreatePRPage() {
  const supabase = createServerClient()
  
  // Fetch materials, plants, mappings, inventory and forecasts
  const [
    { data: materials },
    { data: plants },
    { data: mappings },
    { data: inventory },
    { data: forecasts }
  ] = await Promise.all([
    supabase.from('material_master').select('*').eq('is_active', true),
    supabase.from('plant_master').select('*').eq('is_active', true),
    supabase.from('plant_material_mapping').select('*').eq('is_active', true),
    supabase.from('inventory').select('*'),
    supabase.from('demand_forecast').select('*')
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Stage Indicator */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
            STAGE 01 • REQUISITION INTAKE
          </span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">Create Purchase Requisition</h1>
            <p className="text-slate-500 text-sm max-w-2xl mt-1">
              AI-assisted validation and automated stock inspection with direct multi-agent pipeline routing.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-sm shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Policy Group:</span> Standard Direct Materials
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <PRForm 
        materials={materials || []} 
        plants={plants || []} 
        mappings={mappings || []}
        inventory={inventory || []}
        forecasts={forecasts || []}
      />
    </div>
  )
}
