import Link from 'next/link'
import { Search, Bell, Plus, ChevronDown } from 'lucide-react'

export function NavBar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm">
        <span className="text-slate-500">ProcureAI</span>
        <span className="mx-2 text-slate-300">/</span>
        <span className="font-medium text-slate-800">Workspace</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search materials, PRs, POs..." 
            className="pl-9 pr-12 py-1.5 bg-slate-50 border-none rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 w-64"
          />
          <div className="absolute right-2 flex items-center">
             <kbd className="hidden sm:inline-block bg-white border border-slate-200 rounded px-1.5 text-[10px] font-sans text-slate-400 shadow-sm">⌘K</kbd>
          </div>
        </div>

        {/* Create PR Button */}
        <Link href="/pr/new" className="bg-slate-900 text-white text-sm font-medium px-4 py-1.5 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create PR</span>
        </Link>

        {/* ERP Sync */}
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
          ERP Sync: Live
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
            {/* We can use an img here if we had one, for now a placeholder */}
            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs">
              EV
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </header>
  )
}
