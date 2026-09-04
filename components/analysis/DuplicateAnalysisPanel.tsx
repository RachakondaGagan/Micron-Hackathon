'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, ArrowUpRight, ListChecks } from 'lucide-react'
import type { DuplicateResult } from '@/types'
import { KPIScoreBreakdown } from './KPIScoreBreakdown'

interface DuplicateAnalysisPanelProps {
  result: DuplicateResult | null
}

export function DuplicateAnalysisPanel({ result }: DuplicateAnalysisPanelProps) {
  if (!result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">Agent 1: Duplicate Analysis In Progress</h3>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating requisition similarity across historical requisitions...
        </p>
      </div>
    )
  }

  const isDuplicate = result.duplicate_detected
  const score = Math.round(result.overall_similarity_score)

  const getScoreBadge = () => {
    if (score >= 75) {
      return {
        text: 'High Similarity (Flagged)',
        border: 'border-rose-200',
        bg: 'bg-rose-50',
        textCol: 'text-rose-700',
        barCol: 'bg-rose-500',
      }
    }
    if (score >= 50) {
      return {
        text: 'Moderate Similarity',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        textCol: 'text-amber-700',
        barCol: 'bg-amber-500',
      }
    }
    return {
      text: 'Low Similarity (Unique PR)',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      textCol: 'text-emerald-700',
      barCol: 'bg-emerald-500',
    }
  }

  const badge = getScoreBadge()

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Agent 1 — Duplicate & Pattern Analysis</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Deterministic + Groq LLM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluates 6 weighted dimensions against historical requisitions from the last 7 days.
            </p>
          </div>
        </div>

        {/* Confidence pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Confidence:</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            result.confidence === 'HIGH'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : result.confidence === 'MEDIUM'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {result.confidence}
          </span>
        </div>
      </div>

      {/* Duplicate Alert Banner if duplicate found */}
      {isDuplicate && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Potential Duplicate Requisition Detected
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              This requisition shares high similarity with existing requisition{' '}
              <span className="font-bold font-mono">{result.matched_pr_number || result.matched_pr_id}</span>.
              Review carefully to prevent duplicate vendor procurement and double-spend.
            </p>
            {result.matched_pr_id && (
              <div className="pt-1">
                <Link
                  href={`/pr/${result.matched_pr_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 hover:text-rose-900 underline underline-offset-2"
                >
                  View Matched Requisition {result.matched_pr_number}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two-Column: Score Gauge & Breakdown vs Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Circular gauge + Overall status */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center w-32 h-32 mb-4">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`${
                  score >= 75
                    ? 'stroke-rose-500'
                    : score >= 50
                    ? 'stroke-amber-500'
                    : 'stroke-emerald-500'
                }`}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {score}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Similarity
              </span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.border} ${badge.textCol} mb-2`}>
            {badge.text}
          </div>

          <div className="text-[11px] text-slate-500 text-center max-w-[200px]">
            {isDuplicate
              ? 'Exceeds 75% threshold. Sourcing blocked or flagged for review.'
              : 'Within safe variance limits. No duplicate collision detected.'}
          </div>
        </div>

        {/* Right column: 6 KPI Score Bars */}
        <div className="lg:col-span-8">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Deterministic 6-Factor KPI Evaluation
          </div>
          <KPIScoreBreakdown
            scores={{
              material_match_score: result.material_match_score,
              plant_match_score: result.plant_match_score,
              quantity_similarity_score: result.quantity_similarity_score,
              required_date_similarity_score: result.required_date_similarity_score,
              requestor_match_score: result.requestor_match_score,
              time_gap_score: result.time_gap_score,
            }}
          />
        </div>
      </div>

      {/* LLM Explanation & Evidence Section */}
      <div className="pt-2 border-t border-slate-100 space-y-4">
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Agent Reasoning Narrative
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            {result.explanation}
          </p>
        </div>

        {/* Evidence items */}
        {result.evidence && result.evidence.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <ListChecks className="w-3.5 h-3.5 text-slate-500" />
              Verified Evidence Points
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.evidence.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-slate-50/70 rounded-lg p-2.5 border border-slate-100 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Action */}
        {result.recommended_action && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
            <span className="font-bold shrink-0">Recommended Action:</span>
            <span>{result.recommended_action}</span>
          </div>
        )}
      </div>
    </div>
  )
}
