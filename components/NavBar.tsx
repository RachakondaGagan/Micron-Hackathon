'use client'

import Link from 'next/link'
import { Search, Plus, ChevronDown, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'

type NavBarProps = {
  collapsed?: boolean
  onToggleSidebar?: () => void
}

export function NavBar({ collapsed = false, onToggleSidebar }: NavBarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 w-full">
      {/* Left side: Toggle button + Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}
        <div className="flex items-center text-sm">
          <span className="text-slate-500">ProcureAI</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-800">Workspace</span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search materials, PRs, POs..." 
            className="pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 lg:w-56 xl:w-64"
          />
          <div className="absolute right-2.5 flex items-center">
             <kbd className="hidden lg:inline-block bg-white border border-slate-200 rounded px-1.5 text-[10px] font-sans text-slate-400 shadow-sm">⌘K</kbd>
          </div>
        </div>

        {/* Create PR Button */}
        <Link 
          href="/pr/new" 
          className="bg-slate-900 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Create PR</span>
        </Link>

        {/* ERP Sync status */}
        <div className="hidden xl:flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></div>
          <span>Micron ERP (SAP S/4HANA): Live</span>
        </div>
        <div className="hidden sm:flex xl:hidden items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></div>
          <span>ERP Live</span>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            GR
          </div>
          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-slate-800 leading-tight">Gagan Rachakonda</div>
            <div className="text-slate-500 leading-tight text-[11px] truncate max-w-[150px]">SCM Procurement Lead • Fab 4</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
        </div>
      </div>
    </header>
  )
}
