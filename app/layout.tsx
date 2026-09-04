import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/AppShell'

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
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
