import Link from 'next/link'
import { LayoutDashboard, FileText, Package, Activity, Bell, Settings, Plus, Hexagon } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 text-white border-b border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Hexagon className="w-6 h-6 text-blue-500 fill-blue-500/20" />
          <span>ProcureAI</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 ml-1">Enterprise</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        <div className="text-xs font-semibold text-slate-500 mb-2 px-3 uppercase tracking-wider">Operational Navigation</div>
        
        <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-md">
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-sm font-medium">Requestor Dashboard</span>
        </Link>
        
        <Link href="/pr/new" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-md transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Create Requisition</span>
        </Link>

        <Link href="#" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-md transition-colors">
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">PR Pipeline Trace</span>
        </Link>

        <Link href="#" className="flex items-center justify-between px-3 py-2 hover:bg-slate-800 rounded-md transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Review Queue</span>
          </div>
          <span className="bg-blue-500/20 text-blue-400 text-xs py-0.5 px-2 rounded-full">5</span>
        </Link>

        <Link href="#" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-md transition-colors">
          <Package className="w-4 h-4" />
          <span className="text-sm font-medium">Inventory Health</span>
        </Link>
      </nav>

      {/* Bottom status area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 mb-2 text-sm text-white">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="font-medium">Autonomous Mode</span>
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          <p>Agentic Pilot: <span className="text-slate-300">Enabled</span></p>
          <p>Active Auto-Routing under $25k</p>
        </div>
      </div>
    </aside>
  )
}
