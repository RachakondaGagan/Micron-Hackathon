import Link from 'next/link'
import { Download, Plus, CheckCircle2, AlertCircle, Clock, ShieldAlert, Cpu, Network, CheckSquare, ListTodo, Activity, ShieldCheck, Box, PackageOpen, Package, Search, FileText, ArrowUpRight } from 'lucide-react'
import { headers } from 'next/headers'

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

  // Fallback to mock data if API fails or no data
  const inventory = data?.inventory || []
  const prs = data?.recent_prs || []

  // Aggregate metrics
  const totalAvailable = inventory.reduce((sum: number, item: any) => sum + Number(item.available_stock || 0), 0)
  const totalSafety = inventory.reduce((sum: number, item: any) => sum + Number(item.safety_stock || 0), 0)
  const totalForecast = inventory.reduce((sum: number, item: any) => sum + Number(item.forecasted_demand || 0), 0)
  const totalUsable = inventory.reduce((sum: number, item: any) => sum + Number(item.usable_stock || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Requestor Dashboard</h1>
            <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-blue-200">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
              Micron Boise Fab (PLT-01) Synced
            </span>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">
            Monitor semiconductor inventory thresholds across Micron global fabs, inspect automated replenishment pipelines, and orchestrate requisitions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Inventory Report
          </button>
          <Link href="/pr/new" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Create Purchase Requisition
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
              href="/pr/latest"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>View Latest Pipeline Trace</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
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

      {/* Inventory KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</div>
            <div className="bg-blue-50 p-1.5 rounded-md text-blue-600"><PackageOpen className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{totalAvailable.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span></div>
          <div className="text-xs text-slate-500 mb-4">Across all plants</div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-xs font-medium flex items-center"><Activity className="w-3 h-3 mr-1" /> +5.2%</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">Healthy</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Safety Stock</div>
            <div className="bg-purple-50 p-1.5 rounded-md text-purple-600"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{totalSafety.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span></div>
          <div className="text-xs text-slate-500 mb-4">Threshold Floor</div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs font-medium flex items-center"><ShieldAlert className="w-3 h-3 mr-1" /> Fixed Baseline</span>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-medium">Guarded</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Forecast Demand</div>
            <div className="bg-blue-50 p-1.5 rounded-md text-blue-600"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{totalForecast.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span></div>
          <div className="text-xs text-slate-500 mb-4">Next 30 Days Forecast</div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xs font-medium flex items-center"><Cpu className="w-3 h-3 mr-1" /> AI Model v4.2</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">Stable</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open POs</div>
            <div className="bg-indigo-50 p-1.5 rounded-md text-indigo-600"><FileText className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{data?.recent_pos?.length || 0} <span className="text-sm font-normal text-slate-500">Active</span></div>
          <div className="text-xs text-slate-500 mb-4">Pending delivery</div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs font-medium flex items-center">4 in transit</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">Active</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available to Use</div>
            <div className="bg-emerald-50 p-1.5 rounded-md text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{totalUsable.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span></div>
          <div className="text-xs text-slate-500 mb-4">+8% buffer over run-rate</div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-xs font-medium flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Unallocated</span>
            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium">Adequate</span>
          </div>
        </div>
      </div>

      {/* PR Table Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Purchase Requisitions</h2>
            <p className="text-sm text-slate-500">Track status across validation checks, autonomous vendor quotes, and approval outcomes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="Filter PR ID, material, plant..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 w-64" />
            </div>
            <select className="bg-white border border-slate-200 text-sm rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-slate-300">
              <option>All Statuses</option>
              <option>Approved</option>
              <option>Under Review</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">PR ID</th>
                <th className="px-6 py-4 font-semibold">Material Description</th>
                <th className="px-6 py-4 font-semibold">Assigned Plant</th>
                <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                <th className="px-6 py-4 font-semibold">Required Date</th>
                <th className="px-6 py-4 font-semibold">Pipeline Status</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prs.map((pr: any) => (
                <tr key={pr.pr_id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium">
                    <Link
                      href={`/pr/${pr.pr_id}`}
                      className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {pr.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {pr.status === 'PO_CREATED' && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                      {pr.status === 'UNDER_REVIEW' && <Clock className="w-4 h-4 text-purple-500 shrink-0" />}
                      {pr.status === 'REJECTED' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      {pr.status === 'CREATED' && <ListTodo className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span>{pr.pr_number}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/pr/${pr.pr_id}`} className="block group/link">
                      <div className="font-semibold text-slate-900 group-hover/link:text-blue-600 transition-colors">
                        {pr.material_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {pr.material_id || 'SKU'}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                    <Box className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{pr.plant_name}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                    {pr.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {new Date(pr.required_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                      ${pr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        pr.status === 'PO_CREATED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        pr.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        pr.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                        ${pr.status === 'APPROVED' ? 'bg-emerald-500' : 
                          pr.status === 'PO_CREATED' ? 'bg-indigo-500' :
                          pr.status === 'UNDER_REVIEW' ? 'bg-amber-500 animate-pulse' : 
                          pr.status === 'REJECTED' ? 'bg-rose-500' : 
                          'bg-blue-500'}`}></span>
                      {pr.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/pr/${pr.pr_id}`}
                      className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/80 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs"
                    >
                      <span>AI Trace</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                    </Link>
                  </td>
                </tr>
              ))}
              
              {prs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No purchase requisitions found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {prs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50 rounded-b-xl">
            <div>Showing <span className="font-medium text-slate-900">1 - {prs.length}</span> of <span className="font-medium text-slate-900">{prs.length}</span> requisitions</div>
            <div className="flex gap-1">
              <button className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-400 cursor-not-allowed">{'<'}</button>
              <button className="px-3 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-900 font-medium">1</button>
              <button className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-400 cursor-not-allowed">{'>'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Micron Semiconductor Inventory Health Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Fab Inventory Health & Buffer Monitoring</h2>
            </div>
            <p className="text-sm text-slate-500">Live inventory levels, safety thresholds, and 30-day forecast demand across Micron semiconductor fabrication plants.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 font-medium">
            {inventory.length} Active SKUs Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Material / Chemical</th>
                <th className="px-6 py-4 font-semibold">Micron Fab / Facility</th>
                <th className="px-6 py-4 font-semibold text-right">Available Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Safety Floor</th>
                <th className="px-6 py-4 font-semibold text-right">30d Forecast</th>
                <th className="px-6 py-4 font-semibold text-right">Usable Stock</th>
                <th className="px-6 py-4 font-semibold text-center">Buffer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item: any) => {
                const isInsufficient = item.usable_stock < 0
                const isAtRisk = !isInsufficient && item.available_stock < Number(item.safety_stock)
                const isSufficient = !isInsufficient && !isAtRisk

                return (
                  <tr key={`${item.material_id}-${item.plant_id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div className="font-semibold text-slate-900">{item.material_name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.material_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-medium text-slate-900">{item.plant_name}</div>
                      <div className="text-xs text-slate-400">{item.plant_id}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                      {Number(item.available_stock).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {Number(item.safety_stock).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {Number(item.forecasted_demand || 0).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${item.usable_stock < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {Number(item.usable_stock).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        isSufficient
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isAtRisk
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          isSufficient ? 'bg-emerald-500' : isAtRisk ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {isSufficient ? 'SUFFICIENT' : isAtRisk ? 'AT RISK' : 'INSUFFICIENT'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
