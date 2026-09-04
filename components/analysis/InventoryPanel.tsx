'use client'

import React from 'react'
import { Database, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import type { InventoryResult } from '@/types'

interface InventoryPanelProps {
  result: InventoryResult | null
  unitOfMeasure?: string
}

export function InventoryPanel({ result, unitOfMeasure = 'units' }: InventoryPanelProps) {
  if (!result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <Database className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">Stage 2: Inventory Check In Progress</h3>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating warehouse on-hand stock, safety buffer, and demand forecast...
        </p>
      </div>
    )
  }

  const getStatusDetails = () => {
    switch (result.status) {
      case 'SUFFICIENT':
        return {
          title: 'Stock Sufficient (Internal Fulfillment)',
          badgeText: 'SUFFICIENT',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: CheckCircle2,
          iconCol: 'text-emerald-600',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          desc: 'Warehouse stock is adequate to fulfill this requisition without breaching safety stock thresholds. Sourcing bypass approved.',
        }
      case 'AT_RISK':
        return {
          title: 'Buffer At Risk (Safety Margin Breached)',
          badgeText: 'AT_RISK',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: AlertTriangle,
          iconCol: 'text-amber-600',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          desc: 'Fulfilling this requisition from warehouse stock will breach safety stock thresholds. Triggering supplier evaluation to replenish buffers.',
        }
      case 'INSUFFICIENT':
      default:
        return {
          title: 'Stock Deficit (External Sourcing Required)',
          badgeText: 'INSUFFICIENT',
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: XCircle,
          iconCol: 'text-rose-600',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          desc: 'Current available stock is insufficient to fulfill this requisition. Triggering Agent 2 for multi-vendor market sourcing.',
        }
    }
  }

  const details = getStatusDetails()
  const IconComp = details.icon

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Stage 2 — Inventory & Safety Buffer Evaluation</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Deterministic Arithmetic Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict mathematical check: Usable Stock = Available − Forecasted Demand; Remaining = Usable − PR Qty.
            </p>
          </div>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${details.badgeBg}`}>
          {details.badgeText}
        </span>
      </div>

      {/* Outcome Status Banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3.5 ${details.bg}`}>
        <IconComp className={`w-5 h-5 shrink-0 mt-0.5 ${details.iconCol}`} />
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider">
            {details.title}
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {details.desc}
          </p>
        </div>
      </div>

      {/* 4 Metrics Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Available Stock
          </div>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            {result.available_stock.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Physical on-hand balance
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Safety Stock Buffer
          </div>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            {result.safety_stock.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Mandatory reserve floor
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Forecasted Demand
          </div>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            {result.forecasted_demand.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Next period production plan
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Usable Net Stock
          </div>
          <div className={`text-lg font-extrabold font-mono mt-0.5 ${
            result.usable_stock >= result.safety_stock
              ? 'text-emerald-600'
              : result.usable_stock >= 0
              ? 'text-amber-600'
              : 'text-rose-600'
          }`}>
            {result.usable_stock.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Available minus forecast
          </div>
        </div>
      </div>

      {/* Formula & Impact Breakdown */}
      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Usable: <strong className="font-mono">{result.usable_stock}</strong></span>
            <span className="text-slate-400">−</span>
            <span>PR Qty: <strong className="font-mono">{result.pr_quantity}</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Remaining Balance:{' '}
              <strong className={`font-mono text-sm ${
                result.remaining_after_pr >= result.safety_stock
                  ? 'text-emerald-700'
                  : result.remaining_after_pr >= 0
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}>
                {result.remaining_after_pr} {unitOfMeasure}
              </strong>
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Agent 2 Sourcing Triggered:{' '}
            <strong className={`font-bold ${result.invoke_agent2 ? 'text-blue-600' : 'text-slate-700'}`}>
              {result.invoke_agent2 ? 'YES' : 'NO (BYPASSED)'}
            </strong>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60 leading-relaxed">
          {result.explanation}
        </p>
      </div>
    </div>
  )
}
