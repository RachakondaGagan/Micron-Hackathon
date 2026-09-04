'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'

interface RecentRequisitionsWidgetProps {
  initialPrs: any[]
}

export function RecentRequisitionsWidget({ initialPrs = [] }: RecentRequisitionsWidgetProps) {
  const [prs, setPRs] = useState<any[]>(initialPrs)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchLatestPRs = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/dashboard?requestor_email=gaganrachakonda.work@gmail.com',
        { cache: 'no-store' }
      )
      if (res.ok) {
        const json = await res.json()
        if (json.data?.recent_prs) {
          setPRs(json.data.recent_prs)
        }
      }
    } catch (err) {
      console.warn('Background PR refresh error:', err)
    }
  }, [])

  // Auto-poll every 3.5 seconds to catch real-time pipeline and status changes from DB
  useEffect(() => {
    const interval = setInterval(fetchLatestPRs, 3500)
    return () => clearInterval(interval)
  }, [fetchLatestPRs])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchLatestPRs()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Format date helper (September dates)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD'
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              My Recent Requisitions (Gagan Rachakonda)
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Requisitions submitted by your account queued across Micron fab cleanrooms and autonomous AI evaluation pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualRefresh}
            title="Refresh database records"
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            href="/pr"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs whitespace-nowrap shrink-0"
          >
            <span>View My Requisitions ({prs.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* PR List */}
      <div className="divide-y divide-slate-100">
        {prs.slice(0, 5).map((pr: any) => {
          const isApprovedOrPO = pr.status === 'APPROVED' || pr.status === 'PO_CREATED'
          const isUnderReview = pr.status === 'UNDER_REVIEW'
          const isRejected = pr.status === 'REJECTED'

          return (
            <div
              key={pr.pr_id}
              className="p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="mt-0.5 sm:mt-0">
                  {isApprovedOrPO && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isUnderReview && (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  {isRejected && (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  {!isApprovedOrPO && !isUnderReview && !isRejected && (
                    <ListTodo className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/pipeline?prId=${pr.pr_id}`}
                      className="font-bold text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {pr.pr_number}
                    </Link>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-xs sm:text-sm text-slate-900 truncate">
                      {pr.material_name}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{pr.plant_name}</span>
                    <span>•</span>
                    <span>
                      Qty: <strong className="text-slate-700">{Number(pr.quantity).toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>Req: {formatDate(pr.required_date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                {/* PO CREATED is ALWAYS in Green */}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    isApprovedOrPO
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isUnderReview
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isRejected
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isApprovedOrPO
                        ? 'bg-emerald-500'
                        : isUnderReview
                        ? 'bg-amber-500 animate-pulse'
                        : isRejected
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  {pr.status.replace('_', ' ')}
                </span>

                {pr.po_number && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {pr.po_number}
                  </span>
                )}

                <Link
                  href={`/pipeline?prId=${pr.pr_id}`}
                  className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-2xs"
                >
                  <span>AI Trace</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )
        })}

        {prs.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
            No requisitions found. Create your first purchase requisition to trigger the AI pipeline.
          </div>
        )}
      </div>
    </div>
  )
}
