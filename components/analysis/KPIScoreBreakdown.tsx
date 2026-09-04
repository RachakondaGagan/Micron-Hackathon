'use client'

import React from 'react'

interface KPIScoreBreakdownProps {
  scores: {
    material_match_score: number
    plant_match_score: number
    quantity_similarity_score: number
    required_date_similarity_score: number
    requestor_match_score: number
    time_gap_score: number
  }
}

export function KPIScoreBreakdown({ scores }: KPIScoreBreakdownProps) {
  const kpis = [
    {
      label: 'Material Match',
      weight: 'Weight 5',
      score: scores.material_match_score ?? 0,
      description: 'Exact material SKU identification',
    },
    {
      label: 'Facility Match',
      weight: 'Weight 4',
      score: scores.plant_match_score ?? 0,
      description: 'Target manufacturing plant alignment',
    },
    {
      label: 'Quantity Similarity',
      weight: 'Weight 4',
      score: scores.quantity_similarity_score ?? 0,
      description: 'Continuous order size proximity',
    },
    {
      label: 'Date Proximity',
      weight: 'Weight 3',
      score: scores.required_date_similarity_score ?? 0,
      description: 'Target fulfillment delivery date gap',
    },
    {
      label: 'Requestor Match',
      weight: 'Weight 4',
      score: scores.requestor_match_score ?? 0,
      description: 'Requisition creator email similarity',
    },
    {
      label: 'Recency Time Gap',
      weight: 'Weight 3',
      score: scores.time_gap_score ?? 0,
      description: 'Recency within 7-day lookback window',
    },
  ]

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'bg-rose-500 text-rose-700'
    if (val >= 50) return 'bg-amber-500 text-amber-700'
    return 'bg-emerald-500 text-emerald-700'
  }

  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-rose-500'
    if (val >= 50) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="space-y-3.5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-slate-50/60 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{kpi.label}</span>
              <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                {kpi.weight}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900">
              {Math.round(kpi.score)}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(kpi.score)}`}
              style={{ width: `${Math.max(3, Math.min(100, kpi.score))}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            {kpi.description}
          </div>
        </div>
      ))}
    </div>
  )
}
