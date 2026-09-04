'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Activity, 
  Plus, 
  Hexagon,
  ListTodo,
  CheckSquare,
  Bell
} from 'lucide-react'

type SidebarProps = {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Procurement Dashboard', icon: LayoutDashboard },
    { href: '/pr', label: 'My Requisitions', icon: ListTodo },
    { href: '/pr/new', label: 'Create Requisition', icon: Plus },
    { href: '/reviewer', label: 'Reviewer Log', icon: CheckSquare, badge: 'Queue' },
    { href: '/pipeline', label: 'PR Pipeline Trace', icon: Activity },
    { href: '/#inventory-health', label: 'Inventory Health', icon: Package },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <aside 
      className={`bg-slate-900 text-slate-300 flex flex-col h-full shrink-0 border-r border-slate-800 transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-3.5 text-white border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 font-semibold">
          <Hexagon className="w-5 h-5 text-blue-500 fill-blue-500/20 shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-base font-semibold tracking-tight text-white truncate">Micron ProcureAI</span>
              <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 shrink-0">
                SCM
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2.5 overflow-y-auto">
        {!collapsed && (
          <div className="text-[11px] font-semibold text-slate-500 mb-2 px-2.5 uppercase tracking-wider">
            Operational Navigation
          </div>
        )}
        
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group relative ${
                isActive 
                  ? 'bg-blue-600 text-white font-medium shadow-xs' 
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs sm:text-sm truncate">{item.label}</span>
                  {item.badge && (
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] py-0.5 px-1.5 rounded-full border border-blue-500/30 font-medium shrink-0 ml-1.5">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>



      {/* Bottom Status Box */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-1.5 text-sm text-white">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-medium text-xs">Micron Autonomous Pilot</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <p>Fab Network: <span className="text-slate-200">5 Global Fabs</span></p>
            <p>Auto-Approval: <span className="text-slate-200">&lt; $25,000</span></p>
          </div>
        </div>
      )}
    </aside>
  )
}
