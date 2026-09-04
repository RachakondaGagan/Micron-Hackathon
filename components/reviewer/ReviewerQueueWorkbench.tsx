'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Search,
  Building2,
  Package,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ReviewerQueueWorkbenchProps {
  initialPrs: any[]
}

export function ReviewerQueueWorkbench({ initialPrs }: ReviewerQueueWorkbenchProps) {
  const { toast } = useToast()
  const [prs, setPrs] = useState<any[]>(initialPrs)
  const [activeTab, setActiveTab] = useState<'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ALL'>('UNDER_REVIEW')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [rejectModalPr, setRejectModalPr] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [expandedPrId, setExpandedPrId] = useState<string | null>(null)

  // Metrics
  const pendingCount = prs.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'CREATED').length
  const approvedCount = prs.filter(p => p.status === 'APPROVED' || p.status === 'PO_CREATED').length
  const rejectedCount = prs.filter(p => p.status === 'REJECTED').length

  // Filtered PRs
  const filteredPrs = prs.filter(pr => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'UNDER_REVIEW'
        ? pr.status === 'UNDER_REVIEW' || pr.status === 'CREATED'
        : activeTab === 'APPROVED'
        ? pr.status === 'APPROVED' || pr.status === 'PO_CREATED'
        : pr.status === 'REJECTED'

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      pr.pr_number?.toLowerCase().includes(q) ||
      pr.material_name?.toLowerCase().includes(q) ||
      pr.plant_name?.toLowerCase().includes(q) ||
      pr.requestor_name?.toLowerCase().includes(q)

    return matchesTab && matchesSearch
  })

  // Action: Approve & Issue PO
  const handleApprove = async (pr: any) => {
    setActionLoadingId(pr.pr_id)
    try {
      const res = await fetch('/api/reviewer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pr_id: pr.pr_id,
          action: 'APPROVE',
          notes: 'Approved via SCM Reviewer Log & Action Workbench.',
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Approval failed')

      toast({
        title: 'Requisition Approved',
        description: `${pr.pr_number} approved and PO successfully dispatched.`,
        type: 'success',
      })

      // Update local state
      setPrs(prev =>
        prev.map(p =>
          p.pr_id === pr.pr_id
            ? { ...p, status: json.data?.status || 'PO_CREATED' }
            : p
        )
      )
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.message,
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Action: Submit Rejection
  const handleRejectConfirm = async () => {
    if (!rejectModalPr) return
    setActionLoadingId(rejectModalPr.pr_id)

    try {
      const res = await fetch('/api/reviewer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pr_id: rejectModalPr.pr_id,
          action: 'REJECT',
          notes: rejectReason || 'Requisition rejected by SCM Reviewer.',
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'Rejection failed')

      toast({
        title: 'Requisition Rejected',
        description: `${rejectModalPr.pr_number} marked as REJECTED. Requestor notified.`,
        type: 'info',
      })

      setPrs(prev =>
        prev.map(p =>
          p.pr_id === rejectModalPr.pr_id
            ? { ...p, status: 'REJECTED' }
            : p
        )
      )

      setRejectModalPr(null)
      setRejectReason('')
    } catch (err: any) {
      toast({
        title: 'Rejection Failed',
        description: err.message,
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
              Reviewer Log
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
              Human-in-the-Loop Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-purple-600" />
            Reviewer Log & Action Workbench
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl mt-1">
            Review semiconductor requisitions flagged by autonomous agents for policy thresholds, buffer risks, or supplier validation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-2xs"
          >
            <span>Live Multi-Agent Trace</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards (3 Cards - No Groq Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Under Review Queue</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
          <div className="text-xs text-purple-700 font-medium mt-1">
            Requires human review or approval
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Approved & In Flight</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            Dispatched to cleanroom / ERP
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Rejected / Blocked</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{rejectedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Disallowed duplicates or anomalies</div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('UNDER_REVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'UNDER_REVIEW'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Needs Review</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'UNDER_REVIEW'
                  ? 'bg-purple-700 text-purple-100'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'REJECTED'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rejected ({rejectedCount})
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({prs.length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search PR, item, fab..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Queue Requisition Cards */}
      <div className="space-y-4">
        {filteredPrs.map(pr => {
          const analysis = pr.ai_pr_analysis?.[0] || pr.ai_pr_analysis
          const isPending = pr.status === 'UNDER_REVIEW' || pr.status === 'CREATED'
          const isExpanded = expandedPrId === pr.pr_id
          const isLoading = actionLoadingId === pr.pr_id

          return (
            <div
              key={pr.pr_id}
              className={`bg-white border rounded-xl shadow-xs transition-all ${
                isPending ? 'border-purple-200 ring-1 ring-purple-100' : 'border-slate-200'
              }`}
            >
              {/* Header Bar */}
              <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isPending && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
                      </span>
                    )}
                    {pr.status === 'APPROVED' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {pr.status === 'PO_CREATED' && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                    {pr.status === 'REJECTED' && <XCircle className="w-5 h-5 text-rose-500" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{pr.pr_number}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-sm sm:text-base text-purple-900">
                        {pr.material_name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {pr.material_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {pr.plant_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        Qty: <strong className="text-slate-800">{pr.quantity.toLocaleString()}</strong>
                      </span>
                      <span>•</span>
                      <span>Requestor: {pr.requestor_name}</span>
                      <span>•</span>
                      <span>Target: {new Date(pr.required_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions & Status */}
                <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-auto flex-wrap sm:flex-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isPending
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : pr.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : pr.status === 'PO_CREATED'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {pr.status.replace('_', ' ')}
                  </span>

                  {isPending && (
                    <>
                      <button
                        onClick={() => handleApprove(pr)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Issue PO</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectModalPr(pr)
                          setRejectReason('')
                        }}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  <Link
                    href={`/pipeline?prId=${pr.pr_id}`}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    title="View complete multi-agent pipeline trace"
                  >
                    <span>AI Trace</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </Link>

                  <button
                    onClick={() => setExpandedPrId(isExpanded ? null : pr.pr_id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Toggle AI synthesis details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Multi-Agent Synthesis Row */}
              <div className="p-4 sm:px-5 bg-slate-50/60 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-100 text-xs">
                {/* Agent 1 Duplicate Insight */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <div className="font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Agent 1 • Duplicate Check</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        analysis?.duplicate_result?.duplicate_detected
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {analysis?.duplicate_result?.duplicate_detected ? 'Duplicate Flagged' : 'Unique Requisition'}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    {analysis?.duplicate_result?.duplicate_detected
                      ? `High similarity (${analysis.duplicate_result.overall_similarity_score}%) with prior PR ${analysis.duplicate_result.matched_pr_number || ''}.`
                      : `Semantic similarity score: ${analysis?.duplicate_result?.overall_similarity_score || 0}%. No duplicate orders detected.`}
                  </p>
                </div>

                {/* Rule Engine Inventory Buffer */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <div className="font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Rule Engine • Fab Inventory</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        analysis?.inventory_result?.status === 'SUFFICIENT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {analysis?.inventory_result?.status || 'CHECKED'}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Available: {analysis?.inventory_result?.available_stock?.toLocaleString() || 'N/A'} • Safety floor: {analysis?.inventory_result?.safety_stock?.toLocaleString() || 'N/A'}.
                  </p>
                </div>

                {/* Agent 2 Sourcing Recommendation */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
                  <div className="font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Agent 2 • Recommended Vendor</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-100 text-blue-700">
                      Tier 1 Contract
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium truncate">
                    {analysis?.sourcing_result?.recommended_vendor_name || 'Shin-Etsu Handotai (Rank 1)'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Unit Price: ${analysis?.sourcing_result?.recommended_unit_price || 150} • Lead Time: {analysis?.sourcing_result?.lead_time_days || 7}d
                  </p>
                </div>
              </div>

              {/* Collapsible Details (Agent 3 Decision Rationale) */}
              {isExpanded && (
                <div className="p-4 sm:px-5 bg-purple-50/40 border-t border-purple-100 text-xs">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-purple-900">AI Decision Rationale & Guidance:</span>
                      <p className="text-slate-700 mt-1 leading-relaxed">
                        {analysis?.decision_result?.reason ||
                          'Automated preliminary evaluation completed. Requisition flagged for Reviewer validation based on plant consumption run-rate and tier-1 vendor delivery SLA.'}
                      </p>
                      {analysis?.decision_result?.recommended_next_step && (
                        <p className="text-purple-800 mt-1 font-medium">
                          Next Step: {analysis.decision_result.recommended_next_step}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredPrs.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <div className="font-semibold text-slate-900 text-base">All caught up!</div>
            <p className="text-sm text-slate-500 mt-1">
              No purchase requisitions currently match the &quot;{activeTab.replace('_', ' ')}&quot; filter.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalPr && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Requisition {rejectModalPr.pr_number}</span>
            </div>

            <p className="text-sm text-slate-600">
              Please enter the reviewer rationale for rejecting this requisition. This reason will be logged in the audit trail and sent to the requestor ({rejectModalPr.requestor_name}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Rejection Rationale
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g., Sufficient existing buffer at Boise Fab 4, or duplicate order under active PO-4019..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalPr(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionLoadingId === rejectModalPr.pr_id}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
