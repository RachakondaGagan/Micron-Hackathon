import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { NavBar } from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProcureAI — Intelligent Procurement',
  description: 'AI-assisted purchase requisition management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex min-h-screen`}>
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
