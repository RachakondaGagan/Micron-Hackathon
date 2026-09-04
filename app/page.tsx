import Link from 'next/link'
import { Download, Plus, CheckCircle2, AlertCircle, Clock, Cpu, Network, CheckSquare, ListTodo, Activity, Box, Search, ArrowUpRight } from 'lucide-react'
import { headers } from 'next/headers'
import { InventoryDashboardClient } from '@/components/dashboard/InventoryDashboardClient'
import { RecentRequisitionsWidget } from '@/components/dashboard/RecentRequisitionsWidget'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getDashboardData() {
  const host = headers().get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  try {
    const res = await fetch(`${protocol}://${host}/api/dashboard?requestor_email=gaganrachakonda.work@gmail.com`, { cache: 'no-store' })
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
              Account: Gagan Rachakonda &bull; Fab 4
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Procurement Dashboard</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Monitor semiconductor inventory thresholds across Micron global fabs, inspect automated replenishment pipelines, and orchestrate personal requisitions.
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

      {/* Live Recent Requisition Activity Widget */}
      <RecentRequisitionsWidget initialPrs={prs} />

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
