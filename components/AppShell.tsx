'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { NavBar } from '@/components/NavBar'
import { ToastProvider } from '@/components/ui/toast'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleSidebar = () => {
    setCollapsed(prev => !prev)
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
          <NavBar collapsed={collapsed} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
