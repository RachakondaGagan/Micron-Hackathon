'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ListTodo, 
  Box, 
  ArrowUpRight, 
  Plus, 
  Filter,
  Package,
  Layers,
  Sparkles,
  FileCheck2,
  ShieldCheck
} from 'lucide-react'

interface PRItem {
  pr_id: string
  pr_number: string
  material_name: string
  material_id?: string
  plant_name: string
  plant_id?: string
  quantity: number
  required_date: string
  status: string
  created_at?: string
  has_analysis?: boolean
}

interface PRListTableProps {
  initialPRs: PRItem[]
}

export function PRListTable({ initialPRs }: PRListTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Compute status counts
  const stats = useMemo(() => {
    const total = initialPRs.length
    const approved = initialPRs.filter(p => p.status === 'APPROVED' || p.status === 'PO_CREATED').length
    const review = initialPRs.filter(p => p.status === 'UNDER_REVIEW').length
    const rejected = initialPRs.filter(p => p.status === 'REJECTED').length
    const totalQty = initialPRs.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)

    return { total, approved, review, rejected, totalQty }
  }, [initialPRs])

  // Filter PRs
  const filteredPRs = useMemo(() => {
    return initialPRs.filter(pr => {
      const q = search.toLowerCase().trim()
      const matchesSearch = 
        !q ||
        pr.pr_number?.toLowerCase().includes(q) ||
        pr.material_name?.toLowerCase().includes(q) ||
        pr.plant_name?.toLowerCase().includes(q) ||
        pr.material_id?.toLowerCase().includes(q)

      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'APPROVED' && (pr.status === 'APPROVED' || pr.status === 'PO_CREATED')) ||
        pr.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [initialPRs, search, statusFilter])

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requisitions</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            <div className="text-xs text-slate-400 mt-0.5">Tracked in ProcureAI</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved / PO Issued</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.approved}</div>
            <div className="text-xs text-emerald-600 mt-0.5">Autonomous & manual approved</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.review}</div>
            <div className="text-xs text-amber-600 mt-0.5">Flagged for buyer action</div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Volume</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalQty.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Units requested across fabs</div>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All', count: stats.total },
              { id: 'APPROVED', label: 'Approved & PO', count: stats.approved },
              { id: 'UNDER_REVIEW', label: 'Under Review', count: stats.review },
              { id: 'REJECTED', label: 'Rejected', count: stats.rejected },
            ].map(tab => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter PR ID, material, fab..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline whitespace-nowrap"
              >
                Clear
              </button>
            )}
            <Link
              href="/pr/new"
              className="bg-slate-900 text-white px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create PR</span>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">PR ID</th>
                <th className="px-6 py-3.5">Material Description</th>
                <th className="px-6 py-3.5">Assigned Fab Plant</th>
                <th className="px-6 py-3.5 text-right">Quantity</th>
                <th className="px-6 py-3.5">Required Date</th>
                <th className="px-6 py-3.5">Pipeline Status</th>
                <th className="px-6 py-3.5 text-right">Autonomous Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPRs.map((pr) => (
                <tr key={pr.pr_id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* PR Number */}
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <Link
                      href={`/pipeline?prId=${pr.pr_id}`}
                      className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {(pr.status === 'APPROVED' || pr.status === 'PO_CREATED') && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {pr.status === 'UNDER_REVIEW' && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                      {pr.status === 'REJECTED' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                      {pr.status === 'CREATED' && <ListTodo className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span>{pr.pr_number}</span>
                    </Link>
                  </td>

                  {/* Material */}
                  <td className="px-6 py-4">
                    <Link href={`/pipeline?prId=${pr.pr_id}`} className="block group/link">
                      <div className="font-semibold text-slate-900 group-hover/link:text-blue-600 transition-colors">
                        {pr.material_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {pr.material_id || 'SKU'}
                      </div>
                    </Link>
                  </td>

                  {/* Plant */}
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{pr.plant_name}</span>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {pr.quantity.toLocaleString()}
                  </td>

                  {/* Required Date */}
                  <td className="px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                    {new Date(pr.required_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                      ${pr.status === 'APPROVED' || pr.status === 'PO_CREATED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        pr.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        pr.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                        ${pr.status === 'APPROVED' || pr.status === 'PO_CREATED' ? 'bg-emerald-500' : 
                          pr.status === 'UNDER_REVIEW' ? 'bg-amber-500 animate-pulse' : 
                          pr.status === 'REJECTED' ? 'bg-rose-500' : 
                          'bg-blue-500'}`}></span>
                      {pr.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/pipeline?prId=${pr.pr_id}`}
                      className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>AI Trace</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredPRs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-medium text-slate-800 text-sm">No requisitions matched your filter</p>
                      <p className="text-xs text-slate-500">Try adjusting your search keywords or status filter.</p>
                      <button
                        onClick={() => { setSearch(''); setStatusFilter('ALL') }}
                        className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-block"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredPRs.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-semibold text-slate-900">{filteredPRs.length}</span> of <span className="font-semibold text-slate-900">{initialPRs.length}</span> requisitions
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs text-slate-400 cursor-not-allowed">{'<'}</button>
              <button className="px-3 py-1 bg-blue-600 border border-blue-600 text-white rounded-md font-medium text-xs shadow-2xs">1</button>
              <button className="px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs text-slate-400 cursor-not-allowed">{'>'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
