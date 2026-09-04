'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Factory, Package, User, Building, Clock, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

interface PRInfoCardProps {
  pr: {
    pr_id: string
    pr_number: string
    material_id: string
    material_name?: string
    material_group?: string
    unit_of_measure?: string
    plant_id: string
    plant_name?: string
    plant_location?: string
    quantity: number
    required_date: string
    requestor_name: string
    requestor_email: string
    planner_name?: string | null
    planner_email?: string | null
    status: string
    created_at: string
  }
  onRerun?: () => void
  isRerunning?: boolean
}

export function PRInfoCard({ pr, onRerun, isRerunning }: PRInfoCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        )
      case 'PO_CREATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            PO Generated
          </span>
        )
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        )
      case 'CREATED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Initiated
          </span>
        )
    }
  }

  const formattedDate = pr.created_at ? new Date(pr.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Just now'

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            title="Back to Requisitions"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{pr.pr_number}</h1>
              {getStatusBadge(pr.status)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {formattedDate} • PR ID: <span className="font-mono text-[11px]">{pr.pr_id}</span>
            </p>
          </div>
        </div>

        {onRerun && (
          <button
            onClick={onRerun}
            disabled={isRerunning}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRerunning ? 'animate-spin' : ''}`} />
            {isRerunning ? 'Analyzing Requisition...' : 'Re-run AI Analysis'}
          </button>
        )}
      </div>

      {/* Grid of Key Properties */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            Material SKU
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={pr.material_name}>
            {pr.material_name || pr.material_id}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {pr.material_id} • {pr.material_group || 'General'}
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Factory className="w-3.5 h-3.5 text-slate-500" />
            Target Facility
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={pr.plant_name}>
            {pr.plant_name || pr.plant_id}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {pr.plant_location || pr.plant_id}
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Quantity & Date
          </div>
          <div className="text-sm font-bold text-slate-900">
            {Number(pr.quantity).toLocaleString()} {pr.unit_of_measure || 'units'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Needed by {pr.required_date}
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            Requisition Requestor
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={pr.requestor_name}>
            {pr.requestor_name}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5" title={pr.requestor_email}>
            {pr.requestor_email}
          </div>
        </div>
      </div>
    </div>
  )
}
