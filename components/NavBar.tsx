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
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search materials, PRs, POs..." 
            className="pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 lg:w-64"
          />
          <div className="absolute right-2.5 flex items-center">
             <kbd className="hidden lg:inline-block bg-white border border-slate-200 rounded px-1.5 text-[10px] font-sans text-slate-400 shadow-sm">⌘K</kbd>
          </div>
        </div>

        {/* Create PR Button */}
        <Link 
          href="/pr/new" 
          className="bg-slate-900 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create PR</span>
        </Link>

        {/* ERP Sync status */}
        <div className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
          ERP Sync: Live
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            GR
          </div>
          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-slate-800 leading-tight">Gagan Rachakonda</div>
            <div className="text-slate-500 leading-tight text-[11px]">Senior Buyer & Lead</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  )
}
