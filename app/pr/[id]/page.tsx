'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { PRInfoCard } from '@/components/pr/PRInfoCard'
import { POInfoCard } from '@/components/pr/POInfoCard'
import { PipelineStatus } from '@/components/analysis/PipelineStatus'
import { DuplicateAnalysisPanel } from '@/components/analysis/DuplicateAnalysisPanel'
import { InventoryPanel } from '@/components/analysis/InventoryPanel'
import { VendorRankingTable } from '@/components/analysis/VendorRankingTable'
import { DecisionBanner } from '@/components/analysis/DecisionBanner'

export default function PRDetailPage() {
  const params = useParams()
  const prId = params?.id as string

  const [prData, setPRData] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [po, setPO] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRerunning, setIsRerunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollCountRef = useRef(0)
  const autoTriggeredRef = useRef(false)

  // Fetch PR detail from API
  const fetchPRDetail = useCallback(async (showLoading = false) => {
    if (!prId) return null
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pr/${prId}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Requisition not found')
        throw new Error(`Failed to load requisition (${res.status})`)
      }

      const json = await res.json()
      if (json.error) throw new Error(json.error.message || 'Error loading PR')

      const { pr, analysis: analysisData, purchase_order } = json.data
      setPRData(pr)
      setAnalysis(analysisData)
      setPO(purchase_order)

      return { pr, analysis: analysisData, purchase_order }
    } catch (err: any) {
      console.error('Fetch PR error:', err)
      setError(err.message || 'Failed to load requisition')
      return null
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [prId])

  // Trigger or re-run pipeline
  const triggerPipeline = useCallback(async () => {
    if (!prId) return
    setIsRerunning(true)
    setError(null)

    try {
      const res = await fetch(`/api/pr/${prId}`, {
        method: 'POST',
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Pipeline execution failed')
      }

      // Re-fetch clean joined data
      await fetchPRDetail(false)
    } catch (err: any) {
      console.error('Trigger pipeline error:', err)
      setError(err.message || 'Pipeline execution failed')
    } finally {
      setIsRerunning(false)
    }
  }, [prId, fetchPRDetail])

  // Initial load
  useEffect(() => {
    let isMounted = true

    async function init() {
      const result = await fetchPRDetail(true)
      if (!isMounted) return

      // If PR exists but has no analysis, automatically trigger the pipeline once!
      if (result && result.pr && !result.analysis && !autoTriggeredRef.current) {
        autoTriggeredRef.current = true
        triggerPipeline()
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [fetchPRDetail, triggerPipeline])

  // Polling interval while pipeline is processing
  useEffect(() => {
    if (!prData) return
    // Stop polling once decision is present or if error occurred
    if (analysis?.decision || error) return

    const interval = setInterval(async () => {
      pollCountRef.current += 1
      if (pollCountRef.current > 24) {
        // Max 60 seconds (24 * 2.5s)
        clearInterval(interval)
        return
      }

      const updated = await fetchPRDetail(false)
      if (updated?.analysis?.decision) {
        clearInterval(interval)
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [prData, analysis?.decision, error, fetchPRDetail])

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Loading Requisition & AI Trace...</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Fetching requisition telemetry, historical matches, and agent analysis records.
        </p>
      </div>
    )
  }

  if (error && !prData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 mb-3 border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Unable to Load Requisition</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
        <div className="flex items-center gap-3 mt-5">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Return to Dashboard
          </Link>
          <button
            onClick={() => fetchPRDetail(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!prData) return null

  const isInventorySufficient = analysis?.inventory_result?.status === 'SUFFICIENT'

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Card with Requisition Details */}
      <PRInfoCard
        pr={prData}
        onRerun={triggerPipeline}
        isRerunning={isRerunning}
      />

      {/* 2. Visual AI Pipeline Trace Stepper */}
      <PipelineStatus
        currentStatus={prData.status}
        analysis={analysis}
        isLoading={isRerunning}
        error={error || analysis?.pipeline_error}
        onRefresh={triggerPipeline}
      />

      {/* 3. Executive Decision Banner */}
      <DecisionBanner
        decision={analysis?.decision || null}
        decisionReason={analysis?.decision_reason}
        riskLevel={analysis?.risk_level}
        keyEvidence={analysis?.duplicate_result?.evidence}
        recommendedNextStep={
          analysis?.decision === 'APPROVE'
            ? 'Purchase order auto-generated and sent for ERP fulfillment.'
            : analysis?.decision === 'REVIEW'
            ? 'Requisition dispatched to assigned Planner for manual verification.'
            : 'Requisition blocked to prevent duplicate double-spend.'
        }
      />

      {/* 4. Generated PO Card (if created) */}
      {po && <POInfoCard po={po} />}

      {/* 5. Deep-Dive Agent Trace Panels */}
      <div className="space-y-6 pt-2">
        {/* Stage 1: Duplicate Detection */}
        <DuplicateAnalysisPanel result={analysis?.duplicate_result || null} />

        {/* Stage 2: Inventory & Buffer Check */}
        <InventoryPanel
          result={analysis?.inventory_result || null}
          unitOfMeasure={prData.unit_of_measure}
        />

        {/* Stage 3: Multi-Factor Vendor Sourcing */}
        <VendorRankingTable
          result={analysis?.sourcing_result || null}
          inventorySufficient={isInventorySufficient}
        />
      </div>
    </div>
  )
}
