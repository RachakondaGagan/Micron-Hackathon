'use client'

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Cpu, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Box, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Plus, 
  ChevronDown, 
  Activity, 
  Zap, 
  Database, 
  Network, 
  Terminal, 
  ArrowRight,
  ExternalLink,
  Code
} from 'lucide-react'

import { PRInfoCard } from '@/components/pr/PRInfoCard'
import { POInfoCard } from '@/components/pr/POInfoCard'
import { PipelineStatus } from '@/components/analysis/PipelineStatus'
import { DuplicateAnalysisPanel } from '@/components/analysis/DuplicateAnalysisPanel'
import { InventoryPanel } from '@/components/analysis/InventoryPanel'
import { VendorRankingTable } from '@/components/analysis/VendorRankingTable'
import { DecisionBanner } from '@/components/analysis/DecisionBanner'
import { useToast } from '@/components/ui/toast'

interface PRListItem {
  pr_id: string
  pr_number: string
  material_name: string
  plant_name: string
  quantity: number
  status: string
  required_date: string
}

function PipelineTraceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const requestedPrId = searchParams.get('prId')

  const [prList, setPRList] = useState<PRListItem[]>([])
  const [selectedPrId, setSelectedPrId] = useState<string>('')
  const [prData, setPRData] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [po, setPO] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRerunning, setIsRerunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'AGENT1' | 'RULE' | 'AGENT2' | 'AGENT3' | 'LOGS'>('ALL')
  const [showRawJson, setShowRawJson] = useState(false)

  // 1. Fetch available PRs list
  useEffect(() => {
    async function loadPRs() {
      try {
        const res = await fetch('/api/pr')
        if (!res.ok) return
        const json = await res.json()
        const list: PRListItem[] = json.data?.prs || []
        setPRList(list)

        // Select PR: if requestedPrId exists in list, use it; otherwise default to first PR
        if (requestedPrId && list.some(p => p.pr_id === requestedPrId)) {
          setSelectedPrId(requestedPrId)
        } else if (list.length > 0) {
          setSelectedPrId(list[0].pr_id)
        }
      } catch (err) {
        console.error('Error loading PR list:', err)
      }
    }
    loadPRs()
  }, [requestedPrId])

  // 2. Fetch details for selected PR
  const fetchPRDetail = useCallback(async (id: string, showLoading = false) => {
    if (!id) return
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pr/${id}`)
      if (!res.ok) {
        throw new Error(`Failed to load requisition (${res.status})`)
      }
      const json = await res.json()
      if (json.error) throw new Error(json.error.message || 'Error loading PR trace')

      setPRData(json.data.pr)
      setAnalysis(json.data.analysis)
      setPO(json.data.purchase_order)
    } catch (err: any) {
      setError(err.message || 'Failed to load trace')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPrId) {
      fetchPRDetail(selectedPrId, true)
    }
  }, [selectedPrId, fetchPRDetail])

  // Handle switching PR from selector
  const handleSelectPR = (id: string) => {
    setSelectedPrId(id)
    router.push(`/pipeline?prId=${id}`, { scroll: false })
  }

  // Trigger or re-run pipeline
  const handleRerun = async () => {
    if (!selectedPrId) return
    setIsRerunning(true)
    setError(null)

    try {
      const res = await fetch(`/api/pr/${selectedPrId}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Pipeline execution failed')
      }

      toast({
        title: 'Pipeline Re-Executed',
        description: `Multi-agent pipeline re-evaluated PR ${prData?.pr_number || ''} successfully.`,
        type: 'success',
      })

      await fetchPRDetail(selectedPrId, false)
    } catch (err: any) {
      const msg = err.message || 'Pipeline execution failed'
      setError(msg)
      toast({
        title: 'Pipeline Error',
        description: msg,
        type: 'error',
      })
    } finally {
      setIsRerunning(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-700" />
              AI Agentic Observability
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Groq Llama 3.3 70B Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>PR Pipeline Trace Hub</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl mt-0.5">
            Inspect live multi-agent execution telemetry, validation similarity math, safety buffer routing, and vendor competition decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/pr"
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-slate-50 transition-colors shadow-xs whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>All Requisitions</span>
          </Link>
          <button
            type="button"
            onClick={handleRerun}
            disabled={isRerunning || !selectedPrId}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white px-3.5 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors shadow-xs whitespace-nowrap disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRerunning ? 'animate-spin' : ''}`} />
            <span>{isRerunning ? 'Re-running Pipeline...' : 'Re-Run AI Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Requisition Selector Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Requisition to Trace
            </div>
            <div className="relative">
              <select
                value={selectedPrId}
                onChange={e => handleSelectPR(e.target.value)}
                className="w-full sm:w-80 pl-3 pr-9 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer transition-colors"
              >
                {prList.map(pr => (
                  <option key={pr.pr_id} value={pr.pr_id}>
                    {pr.pr_number} • {pr.material_name} ({pr.plant_name})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Live Execution Telemetry Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end text-xs">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span className="text-slate-500">Pipeline State:</span>
            <span className="font-bold text-slate-900">{prData?.status?.replace('_', ' ') || 'STANDBY'}</span>
          </div>

          {/* Risk Level */}
          {analysis && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Risk Assessment:</span>
              <span className={`font-bold ${
                analysis.risk_level === 'LOW' ? 'text-emerald-700' :
                analysis.risk_level === 'MEDIUM' ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {analysis.risk_level || 'LOW'} RISK
              </span>
            </div>
          )}

          {/* Estimated Savings */}
          {analysis?.estimated_savings && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Savings: <strong>${Number(analysis.estimated_savings).toLocaleString()}</strong></span>
            </div>
          )}

          {/* PO Quicklink if created */}
          {po && (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>PO: {po.po_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stage Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'All Stages (Unified Stream)' },
          { id: 'AGENT1', label: '1. Duplicate Check (Agent 1)' },
          { id: 'RULE', label: '2. Inventory Rule Engine' },
          { id: 'AGENT2', label: '3. Multi-Vendor RFQ (Agent 2)' },
          { id: 'AGENT3', label: '4. Decision Node (Agent 3)' },
          { id: 'LOGS', label: 'Audit & Telemetry Logs' },
        ].map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Rendering based on Tab */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div className="font-semibold text-slate-900 text-sm">Loading Autonomous Pipeline Trace...</div>
          <div className="text-xs text-slate-400">Inspecting multi-agent audit trail and inventory buffers</div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Trace Retrieval Issue</span>
          </div>
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PR Information Card */}
          {prData && <PRInfoCard pr={prData} />}

          {/* Decision Banner */}
          {analysis && (
            <DecisionBanner 
              decision={analysis.decision} 
              decisionReason={analysis.decision_reason} 
              riskLevel={analysis.risk_level} 
              hasPO={Boolean(po)} 
            />
          )}

          {/* Purchase Order Card if generated */}
          {po && <POInfoCard po={po} />}

          {/* Pipeline Stage Visualizer */}
          <PipelineStatus currentStatus={prData?.status || 'CREATED'} analysis={analysis} onRefresh={handleRerun} />

          {/* Tab 1: Duplicate Analysis (Agent 1) */}
          {(activeTab === 'ALL' || activeTab === 'AGENT1') && analysis?.duplicate_result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Stage 01</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-700">Agent 1: Duplicate Detection & Policy Guard</span>
              </div>
              <DuplicateAnalysisPanel result={analysis.duplicate_result} />
            </div>
          )}

          {/* Tab 2: Inventory Analysis (Rule Engine) */}
          {(activeTab === 'ALL' || activeTab === 'RULE') && analysis?.inventory_result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Stage 02</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-700">Deterministic Rule Engine: Fab Stock & Buffer Deficit</span>
              </div>
              <InventoryPanel result={analysis.inventory_result} />
            </div>
          )}

          {/* Tab 3: Sourcing Analysis (Agent 2) */}
          {(activeTab === 'ALL' || activeTab === 'AGENT2') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Stage 03</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-700">Agent 2: Multi-Criteria Sourcing & Supplier Competition</span>
              </div>
              <VendorRankingTable 
                result={analysis?.sourcing_result || null} 
                inventorySufficient={analysis?.inventory_result?.status === 'SUFFICIENT'}
              />
            </div>
          )}

          {/* Tab 4: Agent 3 Decision Node Details */}
          {(activeTab === 'ALL' || activeTab === 'AGENT3') && analysis && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Stage 04</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-700">Agent 3: Autonomous Executive Synthesis</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-50 text-purple-700 p-2 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">LLM Decision Rationale & Trace Synthesis</h3>
                      <p className="text-xs text-slate-400">Synthesized via Groq Llama 3.3 70B Versatile</p>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full border border-purple-100">
                    Confidence: High
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-100">
                  {analysis.decision_reason || 'Autonomous multi-agent evaluation completed successfully.'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-slate-400">Autonomous Threshold</div>
                    <div className="font-bold text-slate-800 mt-0.5">&lt; $25,000 USD</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-slate-400">Audit Compliance</div>
                    <div className="font-bold text-emerald-700 mt-0.5">SOX & ISO Class 1 Compliant</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-slate-400">ERP System Target</div>
                    <div className="font-bold text-slate-800 mt-0.5">Micron SAP S/4HANA Prod</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs & Raw JSON Drawer */}
          {(activeTab === 'ALL' || activeTab === 'LOGS') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Raw Audit & Observability Telemetry</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  {showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON Payload'}
                </button>
              </div>

              {showRawJson && (
                <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                  <pre>{JSON.stringify({ pr: prData, analysis, purchase_order: po }, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PipelineTracePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-500 text-sm">
        Loading Pipeline Trace Hub...
      </div>
    }>
      <PipelineTraceContent />
    </Suspense>
  )
}
