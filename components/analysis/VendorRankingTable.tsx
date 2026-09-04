'use client'

import React from 'react'
import { ShoppingCart, Star, CheckCircle2, TrendingUp, AlertTriangle, FastForward, Award, DollarSign, Clock, MapPin } from 'lucide-react'
import type { SourcingResult } from '@/types'

interface VendorRankingTableProps {
  result: SourcingResult | null
  inventorySufficient?: boolean
}

export function VendorRankingTable({ result, inventorySufficient = false }: VendorRankingTableProps) {
  if (inventorySufficient) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto mb-2">
          <FastForward className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Agent 2: Sourcing Stage Bypassed</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Internal warehouse inventory has sufficient stock available. No external supplier procurement or PO emission is needed.
        </p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">Agent 2: Supplier Sourcing In Progress</h3>
        <p className="text-xs text-slate-500 mt-1">
          Evaluating eligible ERP supplier contracts, pricing matrices, and lead times...
        </p>
      </div>
    )
  }

  if (result.no_vendors_found || !result.ranked_vendors || result.ranked_vendors.length === 0) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          No Qualified Vendors Found
        </div>
        <p className="text-xs text-rose-700">
          {result.explanation || 'No active contracts exist in ERP vendor master for this material. Requisition requires buyer escalation.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Agent 2 — Multi-Factor Supplier Optimization</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                5-Factor Scoring Model
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Weighted optimization: Price (30%), Lead Time (25%), Location (20%), Quality (15%), OTD (10%).
            </p>
          </div>
        </div>

        {/* Estimated Savings Pill */}
        {result.estimated_savings !== null && result.estimated_savings > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Est. Savings: <strong>${result.estimated_savings.toLocaleString()}</strong> vs next-best quote</span>
          </div>
        )}
      </div>

      {/* Top Supplier Spotlight Card */}
      {result.recommended_vendor_name && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Recommended Primary Supplier
              </div>
              <div className="text-base font-extrabold text-slate-900">
                {result.recommended_vendor_name}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Top multi-factor composite score across lead-time agility, cost efficiency, and quality rating.
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              Rank #1 Selected
            </span>
          </div>
        </div>
      )}

      {/* Ranked Vendors Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Vendor Partner</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Lead Time</th>
                <th className="py-3 px-4 text-center">Quality</th>
                <th className="py-3 px-4 text-right">OTD %</th>
                <th className="py-3 px-4 text-right">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.ranked_vendors.map((v) => {
                const isTop = v.rank === 1
                return (
                  <tr
                    key={v.vendor_id}
                    className={`transition-colors ${
                      isTop ? 'bg-blue-50/40 font-medium' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3 px-4">
                      {isTop ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px]">
                          1
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                          {v.rank}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{v.vendor_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.vendor_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {v.vendor_location}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(v.unit_price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 font-mono">
                      {v.lead_time_days} days
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        {Number(v.quality_rating).toFixed(1)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {Math.round(Number(v.on_time_delivery))}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        isTop
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {Math.round(v.total_score)}/100
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sourcing Narrative & Trade-offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Trade-Off Analysis
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {result.trade_off_summary || result.explanation}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Identified Sourcing Risks
          </div>
          {result.sourcing_risks && result.sourcing_risks.length > 0 ? (
            <ul className="space-y-1.5">
              {result.sourcing_risks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No critical supply chain risks identified for awarded supplier.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
