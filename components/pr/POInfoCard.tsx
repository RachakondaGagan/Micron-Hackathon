'use client'

import React from 'react'
import { FileCheck, CheckCircle2, Building, DollarSign, Calendar, Truck, ArrowUpRight } from 'lucide-react'

interface POInfoCardProps {
  po: {
    po_id: string
    po_number: string
    vendor_id: string
    vendor_name?: string | null
    quantity: number
    unit_price: number
    total_amount: number
    order_date: string
    expected_delivery_date: string
    status: string
  } | null
}

export function POInfoCard({ po }: POInfoCardProps) {
  if (!po) return null

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 border border-indigo-200/80 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Purchase Order Dispatched</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ERP Integrated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically generated and booked via RPC <span className="font-mono font-semibold">generate_po_number()</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            {po.po_number}
          </span>
        </div>
      </div>

      {/* 4 PO Details Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/80 rounded-xl p-3.5 border border-indigo-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            Awarded Supplier
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" title={po.vendor_name || po.vendor_id}>
            {po.vendor_name || po.vendor_id}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Vendor ID: {po.vendor_id}
          </div>
        </div>

        <div className="bg-white/80 rounded-xl p-3.5 border border-indigo-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
            Total Value
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            ${Number(po.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ${Number(po.unit_price).toFixed(2)} × {Number(po.quantity).toLocaleString()}
          </div>
        </div>

        <div className="bg-white/80 rounded-xl p-3.5 border border-indigo-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Expected Delivery
          </div>
          <div className="text-sm font-bold text-slate-900">
            {po.expected_delivery_date}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Order Date: {po.order_date}
          </div>
        </div>

        <div className="bg-white/80 rounded-xl p-3.5 border border-indigo-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Truck className="w-3.5 h-3.5 text-indigo-500" />
            Fulfillment Status
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            {po.status}
          </div>
        </div>
      </div>
    </div>
  )
}
