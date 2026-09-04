'use client'

import React from 'react'
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, ListFilter } from 'lucide-react'
import type { DecisionType, RiskLevelType } from '@/types'

interface DecisionBannerProps {
  decision: DecisionType | null
  decisionReason?: string | null
  riskLevel?: RiskLevelType | null
  keyEvidence?: string[]
  recommendedNextStep?: string | null
  hasPO?: boolean
}

export function DecisionBanner({
  decision,
  decisionReason,
  riskLevel = 'LOW',
  keyEvidence = [],
  recommendedNextStep,
  hasPO = false,
}: DecisionBannerProps) {
  if (!decision) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">Agent 3: Decision Engine Evaluating</h3>
        <p className="text-xs text-slate-500 mt-1">
          Applying procurement compliance rules, risk constraints, and anti-downgrade invariants...
        </p>
      </div>
    )
  }

  const getDecisionTheme = () => {
    switch (decision) {
      case 'APPROVE':
        return {
          title: hasPO ? 'Autonomous PO Approval Granted' : 'Approved — Fulfilled From Warehouse Stock',
          subtitle: hasPO
            ? 'Requisition approved and supplier purchase order generated for procurement.'
            : 'Internal inventory is sufficient. External vendor purchase bypassed — 0 purchase orders required.',
          bg: 'bg-emerald-500/10 border-emerald-300/80',
          badgeBg: 'bg-emerald-600 text-white',
          badgeText: hasPO ? 'APPROVE (PO DISPATCHED)' : 'APPROVE (INTERNAL FULFILLMENT)',
          textHead: 'text-emerald-950',
          textSub: 'text-emerald-800',
          icon: ShieldCheck,
          iconCol: 'text-emerald-600 bg-emerald-100',
        }
      case 'REVIEW':
        return {
          title: 'Human Review Required',
          subtitle: 'Requisition flagged for planner verification due to risk or stock variance.',
          bg: 'bg-amber-500/10 border-amber-300/80',
          badgeBg: 'bg-amber-600 text-white',
          textHead: 'text-amber-950',
          textSub: 'text-amber-800',
          icon: AlertTriangle,
          iconCol: 'text-amber-600 bg-amber-100',
        }
      case 'REJECT':
      default:
        return {
          title: 'Requisition Rejected',
          subtitle: 'Requisition breached mandatory duplicate or corporate compliance guardrails.',
          bg: 'bg-rose-500/10 border-rose-300/80',
          badgeBg: 'bg-rose-600 text-white',
          textHead: 'text-rose-950',
          textSub: 'text-rose-800',
          icon: ShieldAlert,
          iconCol: 'text-rose-600 bg-rose-100',
        }
    }
  }

  const theme = getDecisionTheme()
  const IconComp = theme.icon

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'LOW':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  }

  return (
    <div className={`rounded-2xl border p-6 shadow-xs space-y-5 transition-all ${theme.bg}`}>
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl shrink-0 ${theme.iconCol}`}>
            <IconComp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${theme.badgeBg}`}>
                {(theme as any).badgeText || decision}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getRiskBadge()}`}>
                Risk: {riskLevel || 'LOW'}
              </span>
            </div>
            <h2 className={`text-lg font-extrabold tracking-tight mt-1 ${theme.textHead}`}>
              {theme.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Decision Reason */}
      {decisionReason && (
        <div className="bg-white/90 backdrop-blur-xs rounded-xl p-4 border border-white/60 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Executive Governance Rationale
          </div>
          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            {decisionReason}
          </p>
        </div>
      )}

      {/* Key Evidence & Recommended Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {recommendedNextStep && (
          <div className="bg-white/80 rounded-xl p-3.5 border border-white/60 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
              Recommended Next Step
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {recommendedNextStep}
            </p>
          </div>
        )}

        {keyEvidence && keyEvidence.length > 0 && (
          <div className="bg-white/80 rounded-xl p-3.5 border border-white/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <ListFilter className="w-3.5 h-3.5 text-slate-500" />
              Key Evidence Points
            </div>
            <ul className="space-y-1">
              {keyEvidence.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
