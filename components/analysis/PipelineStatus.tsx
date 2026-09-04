'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FastForward, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  ShoppingCart, 
  BellRing,
  Play,
  RotateCcw
} from 'lucide-react'

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
  onStageChange?: (stage: number) => void
}

export function PipelineStatus({
  currentStatus,
  analysis,
  isLoading = false,
  error = null,
  onRefresh,
  onStageChange,
}: PipelineStatusProps) {
  // Animated step index: 0 = Agent 1 running, 1 = Inventory running, 2 = Agent 2 running, 3 = Agent 3 running, 4 = Agent 4 running, 5 = All finished
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isAnimationRunning, setIsAnimationRunning] = useState<boolean>(true)
  const hasAnimatedRef = useRef<boolean>(false)

  const isCompletedData = !!analysis && !!analysis.decision
  const isFailed = !!error || !!analysis?.pipeline_error
  const agent2Skipped = analysis?.inventory_result?.status === 'SUFFICIENT'

  // Stepped sequential animation: moves slowly from Agent 1 to Agent 4
  useEffect(() => {
    if (!analysis && !isLoading) {
      setCurrentStepIndex(0)
      setIsAnimationRunning(true)
      return
    }

    // Reset and run sequential animation when analysis arrives or when refreshed
    setIsAnimationRunning(true)
    setCurrentStepIndex(0)
    onStageChange?.(0)

    const stageTimings = [1300, 1300, 1200, 1400, 1100] // ms per agent stage
    let timeoutId: NodeJS.Timeout
    let current = 0

    function nextStage() {
      if (current < stageTimings.length) {
        timeoutId = setTimeout(() => {
          current += 1
          setCurrentStepIndex(current)
          onStageChange?.(current)
          if (current < stageTimings.length) {
            nextStage()
          } else {
            setIsAnimationRunning(false)
            hasAnimatedRef.current = true
          }
        }, stageTimings[current])
      }
    }

    nextStage()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [analysis?.updated_at || analysis?.decision, isLoading])

  const replayAnimation = () => {
    setIsAnimationRunning(true)
    setCurrentStepIndex(0)
    onStageChange?.(0)

    const stageTimings = [1200, 1200, 1100, 1300, 1000]
    let current = 0

    function nextStage() {
      if (current < stageTimings.length) {
        setTimeout(() => {
          current += 1
          setCurrentStepIndex(current)
          onStageChange?.(current)
          if (current < stageTimings.length) {
            nextStage()
          } else {
            setIsAnimationRunning(false)
          }
        }, stageTimings[current])
      }
    }

    nextStage()
  }

  // Derive individual step state based on currentStepIndex during animation
  const getStepState = (stepIndex: number, isSkipped = false): StepState => {
    if (isFailed) return 'FAILED'
    if (currentStepIndex < stepIndex) return 'PENDING'
    if (currentStepIndex === stepIndex) return 'RUNNING'
    // currentStepIndex > stepIndex (stage has finished)
    if (isSkipped) return 'SKIPPED'
    return 'COMPLETED'
  }

  const agent1State = getStepState(0)
  const inventoryState = getStepState(1)
  const agent2State = getStepState(2, agent2Skipped)
  const agent3State = getStepState(3)
  const agent4State = getStepState(4)

  const steps: PipelineStep[] = [
    {
      id: 'agent1',
      title: 'Agent 1: Requisition Matcher',
      subtitle: 'Pattern & Duplicate Analysis',
      state: agent1State,
      icon: Sparkles,
      summary: agent1State === 'RUNNING'
        ? 'Scanning historical PRs for duplicate patterns...'
        : agent1State === 'COMPLETED' && analysis?.duplicate_result
        ? `${analysis.duplicate_result.overall_similarity_score}% similarity (${analysis.duplicate_result.duplicate_detected ? 'Duplicate Flagged' : 'Unique Order'})`
        : 'Awaiting pipeline dispatch...',
    },
    {
      id: 'inventory',
      title: 'Inventory & Forecast Engine',
      subtitle: 'Deterministic Stock Math',
      state: inventoryState,
      icon: Database,
      summary: inventoryState === 'RUNNING'
        ? 'Calculating fab buffer floor & 30d run-rate...'
        : inventoryState === 'COMPLETED' && analysis?.inventory_result
        ? `Stock: ${analysis.inventory_result.status} (Usable: ${analysis.inventory_result.usable_stock})`
        : 'Queued behind Agent 1 validation...',
    },
    {
      id: 'agent2',
      title: 'Agent 2: Supplier Sourcing',
      subtitle: 'Multi-Factor Vendor Ranking',
      state: agent2State,
      icon: ShoppingCart,
      summary: agent2State === 'SKIPPED'
        ? 'Bypassed: Local inventory buffer is sufficient'
        : agent2State === 'RUNNING'
        ? 'Evaluating tier-1 supplier SLA contracts...'
        : agent2State === 'COMPLETED' && analysis?.sourcing_result
        ? `Ranked ${analysis.sourcing_result.ranked_vendors?.length || 0} vendors (Top: ${analysis.sourcing_result.recommended_vendor_name || 'N/A'})`
        : 'Queued behind stock buffer evaluation...',
    },
    {
      id: 'agent3',
      title: 'Agent 3: Executive Decision',
      subtitle: 'Governance & Invariants',
      state: agent3State,
      icon: ShieldCheck,
      summary: agent3State === 'RUNNING'
        ? 'Enforcing Micron procurement policies & invariants...'
        : agent3State === 'COMPLETED' && analysis?.decision
        ? `Decision: ${analysis.decision} (Risk: ${analysis.risk_level || 'LOW'})`
        : 'Queued behind sourcing synthesis...',
    },
    {
      id: 'agent4',
      title: 'Agent 4: Stakeholder Dispatch',
      subtitle: 'Notifications & PO Emission',
      state: agent4State,
      icon: BellRing,
      summary: agent4State === 'RUNNING'
        ? 'Dispatching real-time email & in-app alerts...'
        : agent4State === 'COMPLETED'
        ? 'Dispatched stakeholder notifications & ERP record'
        : 'Queued behind executive governance decision...',
    },
  ]

  const getStepIcon = (state: StepState, IconComp: React.ComponentType<{ className?: string }>) => {
    switch (state) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
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
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        )
      case 'RUNNING':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            Analyzing
          </span>
        )
      case 'SKIPPED':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            Skipped
          </span>
        )
      case 'FAILED':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        )
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
            Queued
          </span>
        )
    }
  }

  // Calculate percentage progress for the top bar
  const progressPercent = Math.min(100, Math.round(((currentStepIndex + (isAnimationRunning ? 0.5 : 1)) / 5) * 100))

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      {/* Top Progress Bar moving sequentially */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Autonomous AI Pipeline Trace
            </h2>

            {isAnimationRunning && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Live Agent Telemetry ({Math.min(currentStepIndex + 1, 5)} / 5)
              </span>
            )}

            {!isAnimationRunning && isCompletedData && (
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

        <div className="flex items-center gap-2">
          {!isAnimationRunning && (
            <button
              type="button"
              onClick={replayAnimation}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Replay sequential multi-agent execution animation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Replay Animation</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Loader2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-run Analysis</span>
            </button>
          )}
        </div>
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
              className={`rounded-xl border p-4 transition-all duration-500 flex flex-col justify-between relative ${
                isCurrentActive
                  ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-200 shadow-md scale-[1.02]'
                  : isDone
                  ? 'bg-slate-50/60 border-emerald-200/80 shadow-2xs'
                  : isSkip
                  ? 'bg-slate-50/40 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200 opacity-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`p-2 rounded-lg transition-colors ${
                    isCurrentActive
                      ? 'bg-blue-600 text-white shadow-sm'
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
                <span className="text-[11px] text-slate-600 font-medium truncate max-w-[130px]" title={step.summary}>
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
