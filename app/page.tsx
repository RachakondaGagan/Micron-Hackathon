import Link from 'next/link'
import { Download, Plus, CheckCircle2, AlertCircle, Clock, Cpu, Network, CheckSquare, ListTodo, Activity, Box, Search, ArrowUpRight } from 'lucide-react'
import { headers } from 'next/headers'
import { InventoryDashboardClient } from '@/components/dashboard/InventoryDashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getDashboardData() {
  const host = headers().get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  try {
    const res = await fetch(`${protocol}://${host}/api/dashboard`, { cache: 'no-store' })
    if (!res.ok) {
      return null
    }
    const json = await res.json()
    return json.data
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const inventory = data?.inventory || []
  const materials = data?.materials || []
  const plants = data?.plants || []
  const prs = data?.recent_prs || []
  const recentPos = data?.recent_pos || []

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Requestor Dashboard</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Monitor semiconductor inventory thresholds across Micron global fabs, inspect automated replenishment pipelines, and orchestrate requisitions.
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <a
            href="#inventory-health"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Fab Inventory Health</span>
          </a>
          <Link href="/pr/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap shrink-0">
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Purchase Requisition</span>
          </Link>
        </div>
      </div>

      {/* Agentic Orchestration State */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-1.5 rounded-md">
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Agentic Orchestration State</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 ml-2">
              Multi-Table DB Connected (10 Tables)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>View Live Pipeline Trace Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-md h-fit">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Agent 1</div>
              <div className="font-medium text-slate-900 text-sm mb-1">Validation</div>
              <div className="text-xs text-slate-500 leading-tight">Duplicate & Master Check</div>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-md h-fit">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Rule-Based</div>
              <div className="font-medium text-slate-900 text-sm mb-1">Inventory Check</div>
              <div className="text-xs text-slate-500 leading-tight">Safety Stock & Forecast</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex gap-3">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-md h-fit">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Agent 2</div>
              <div className="font-medium text-slate-900 text-sm mb-1">Sourcing Analysis</div>
              <div className="text-xs text-slate-500 leading-tight">Eligible Vendors & Lead Time</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-md h-fit">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Agent 3</div>
              <div className="font-medium text-slate-900 text-sm mb-1">Decision Node</div>
              <div className="text-xs text-slate-500 leading-tight">Approve / Review / Reject</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requisition Activity Banner */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Recent Requisition Activity</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Latest requisitions queued across Micron fab cleanrooms and autonomous AI evaluation pipelines.
            </p>
          </div>
          <Link
            href="/pr"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs whitespace-nowrap shrink-0"
          >
            <span>View All Requisitions ({prs.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {prs.slice(0, 3).map((pr: any) => (
            <div key={pr.pr_id} className="p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="mt-0.5 sm:mt-0">
                  {pr.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {pr.status === 'PO_CREATED' && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                  {pr.status === 'UNDER_REVIEW' && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                  {pr.status === 'REJECTED' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  {pr.status === 'CREATED' && <ListTodo className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/pipeline?prId=${pr.pr_id}`} className="font-bold text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline">
                      {pr.pr_number}
                    </Link>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-xs sm:text-sm text-slate-900 truncate">{pr.material_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{pr.plant_name}</span>
                    <span>•</span>
                    <span>Qty: <strong className="text-slate-700">{pr.quantity.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Req: {new Date(pr.required_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border
                  ${pr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    pr.status === 'PO_CREATED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    pr.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    pr.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                    'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                    ${pr.status === 'APPROVED' ? 'bg-emerald-500' : 
                      pr.status === 'PO_CREATED' ? 'bg-indigo-500' :
                      pr.status === 'UNDER_REVIEW' ? 'bg-amber-500' : 
                      pr.status === 'REJECTED' ? 'bg-rose-500' : 
                      'bg-blue-500'}`}></span>
                  {pr.status.replace('_', ' ')}
                </span>
                <Link
                  href={`/pipeline?prId=${pr.pr_id}`}
                  className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-2xs"
                >
                  <span>AI Trace</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}

          {prs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
              No requisitions found. Create your first purchase requisition to trigger the AI pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Semiconductor Multi-Material & Fab Inventory Hub */}
      <InventoryDashboardClient
        inventory={inventory}
        materials={materials}
        plants={plants}
        recentPos={recentPos}
      />

    </div>
  )
}
