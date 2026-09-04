'use client'

import React from 'react'
import { CheckCircle2, Clock, AlertCircle, FastForward, Loader2, Sparkles, ShieldCheck, Database, ShoppingCart, BellRing } from 'lucide-react'

export type StepState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED'

export interface PipelineStep {
  id: string
  title: string
  subtitle: string
  state: StepState
  icon: React.ComponentType<{ className?: string }>
  summary?: string
}

interface PipelineStatusProps {
  currentStatus: string
  analysis: any
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export function PipelineStatus({
  currentStatus,
  analysis,
  isLoading = false,
  error = null,
  onRefresh,
}: PipelineStatusProps) {
  const isCompleted = !!analysis && !!analysis.decision
  const isRunning = isLoading || (currentStatus === 'CREATED' || currentStatus === 'UNDER_REVIEW') && !analysis?.decision && !error
  const isFailed = !!error || !!analysis?.pipeline_error

  // Derive stage states
  const agent1State: StepState = analysis?.duplicate_result
    ? 'COMPLETED'
    : isRunning
    ? 'RUNNING'
    : isFailed
    ? 'FAILED'
    : 'PENDING'

  const inventoryState: StepState = analysis?.inventory_result
    ? 'COMPLETED'
    : analysis?.duplicate_result && isRunning
    ? 'RUNNING'
    : isRunning
    ? 'PENDING'
    : isFailed
    ? 'FAILED'
    : 'PENDING'

  const agent2Skipped = analysis?.inventory_result?.status === 'SUFFICIENT'
  const agent2State: StepState = agent2Skipped
    ? 'SKIPPED'
    : analysis?.sourcing_result
    ? 'COMPLETED'
    : analysis?.inventory_result && !agent2Skipped && isRunning
    ? 'RUNNING'
    : isRunning
    ? 'PENDING'
    : isFailed
    ? 'FAILED'
    : 'PENDING'

  const agent3State: StepState = analysis?.decision
    ? 'COMPLETED'
    : (analysis?.sourcing_result || (analysis?.inventory_result && agent2Skipped)) && isRunning
    ? 'RUNNING'
    : isRunning
    ? 'PENDING'
    : isFailed
    ? 'FAILED'
    : 'PENDING'

  const agent4State: StepState = analysis?.decision
    ? 'COMPLETED'
    : isRunning
    ? 'PENDING'
    : 'PENDING'

  const steps: PipelineStep[] = [
    {
      id: 'agent1',
      title: 'Agent 1: Requisition Matcher',
      subtitle: 'Pattern & Duplicate Analysis',
      state: agent1State,
      icon: Sparkles,
      summary: analysis?.duplicate_result
        ? `${analysis.duplicate_result.overall_similarity_score}% similarity (${analysis.duplicate_result.confidence} conf)`
        : 'Analyzing last 7 days of historical PRs...',
    },
    {
      id: 'inventory',
      title: 'Inventory & Forecast Engine',
      subtitle: 'Deterministic Stock Math',
      state: inventoryState,
      icon: Database,
      summary: analysis?.inventory_result
        ? `Status: ${analysis.inventory_result.status} (Usable: ${analysis.inventory_result.usable_stock})`
        : 'Calculating safety buffer & 30d forecast...',
    },
    {
      id: 'agent2',
      title: 'Agent 2: Supplier Sourcing',
      subtitle: 'Multi-Factor Vendor Ranking',
      state: agent2State,
      icon: ShoppingCart,
      summary: agent2Skipped
        ? 'Bypassed: Local stock is sufficient'
        : analysis?.sourcing_result
        ? `Ranked ${analysis.sourcing_result.ranked_vendors?.length || 0} vendors (Top: ${analysis.sourcing_result.recommended_vendor_name || 'N/A'})`
        : 'Evaluating active supplier contracts...',
    },
    {
      id: 'agent3',
      title: 'Agent 3: Executive Decision',
      subtitle: 'Governance & Invariants',
      state: agent3State,
      icon: ShieldCheck,
      summary: analysis?.decision
        ? `Outcome: ${analysis.decision} (Risk: ${analysis.risk_level || 'LOW'})`
        : 'Enforcing business rules & anti-downgrade logic...',
    },
    {
      id: 'agent4',
      title: 'Agent 4: Stakeholder Dispatch',
      subtitle: 'Notifications & PO Emission',
      state: agent4State,
      icon: BellRing,
      summary: isCompleted
        ? 'Dispatched in-app notification & audit log'
        : 'Preparing stakeholder routing...',
    },
  ]

  const getStepIcon = (state: StepState, IconComp: React.ComponentType<{ className?: string }>) => {
    switch (state) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'SKIPPED':
        return <FastForward className="w-5 h-5 text-slate-400" />
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-rose-500" />
      default:
        return <Clock className="w-5 h-5 text-slate-300" />
    }
  }

  const getStepBadge = (state: StepState) => {
    switch (state) {
      case 'COMPLETED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>
      case 'RUNNING':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            Analyzing
          </span>
        )
      case 'SKIPPED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Skipped</span>
      case 'FAILED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Failed</span>
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">Queued</span>
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      {/* Background glowing gradient when running */}
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 animate-pulse" />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Autonomous AI Pipeline Trace</h2>
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Live Execution
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Trace Verified
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry showing sequential reasoning across deterministic formulas and Groq LLM agents.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Loader2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Re-run Analysis
          </button>
        )}
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const isCurrentActive = step.state === 'RUNNING'
          const isDone = step.state === 'COMPLETED'
          const isSkip = step.state === 'SKIPPED'

          return (
            <div
              key={step.id}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between relative ${
                isCurrentActive
                  ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100 shadow-xs'
                  : isDone
                  ? 'bg-slate-50/60 border-emerald-200/80'
                  : isSkip
                  ? 'bg-slate-50/40 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`p-2 rounded-lg ${
                    isCurrentActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : isSkip
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  {getStepBadge(step.state)}
                </div>

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Stage 0{idx + 1}
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {step.title}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {step.subtitle}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-medium truncate max-w-[130px]">
                  {step.summary}
                </span>
                <div>{getStepIcon(step.state, step.icon)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
