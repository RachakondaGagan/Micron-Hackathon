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
      <div className="flex min-h-screen bg-slate-50 text-slate-900 w-full overflow-x-hidden">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
          <NavBar collapsed={collapsed} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
