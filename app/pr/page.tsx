import React from 'react'
import Link from 'next/link'
import { Plus, ShieldCheck, Download, Cpu, Layers } from 'lucide-react'
import { createServerClient } from '@/lib/supabase'
import { PRListTable } from '@/components/pr/PRListTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getRequisitions() {
  try {
    const supabase = createServerClient()
    
    // Fetch materials & plants maps
    const [{ data: materials }, { data: plants }] = await Promise.all([
      supabase.from('material_master').select('material_id, material_name'),
      supabase.from('plant_master').select('plant_id, plant_name')
    ])

    const matMap = new Map((materials || []).map(m => [m.material_id, m.material_name]))
    const pltMap = new Map((plants || []).map(p => [p.plant_id, p.plant_name]))

    const { data: prs, error } = await supabase
      .from('purchase_requisitions')
      .select('pr_id, pr_number, material_id, plant_id, quantity, required_date, status, created_at, requestor_name, requestor_email')
      .or('requestor_email.eq.gaganrachakonda.work@gmail.com,requestor_name.eq.Gagan Rachakonda')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching PRs:', error)
      return []
    }

    return (prs || []).map((pr: any) => ({
      ...pr,
      material_name: matMap.get(pr.material_id) || pr.material_id,
      plant_name: pltMap.get(pr.plant_id) || pr.plant_id,
      quantity: Number(pr.quantity)
    }))
  } catch (err) {
    console.error('getRequisitions failure:', err)
    return []
  }
}

export default async function RequisitionsPage() {
  const prs = await getRequisitions()

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
              Personal Account &bull; Gagan Rachakonda
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My Purchase Requisitions
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl mt-1">
            Track your personal semiconductor material requisitions, automated AI evaluations, and ERP purchase order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/reviewer"
            className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors shadow-2xs whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Reviewer Log (Company Queue)</span>
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap"
          >
            <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
            <span>AI Pipeline Trace</span>
          </Link>
          <Link
            href="/pr/new"
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Requisition</span>
          </Link>
        </div>
      </div>

      {/* Main Filterable Table Component */}
      <PRListTable initialPRs={prs} />
    </div>
  )
}
