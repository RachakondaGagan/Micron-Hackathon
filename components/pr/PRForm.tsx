'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Calendar, Box, Activity, CheckCircle2, Clock, Network, Search } from 'lucide-react'

type PRFormProps = {
  materials: any[]
  plants: any[]
  mappings: any[]
}

export function PRForm({ materials, plants, mappings }: PRFormProps) {
  const router = useRouter()
  
  const [materialId, setMaterialId] = useState('')
  const [plantId, setPlantId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [requiredDate, setRequiredDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter plants based on selected material
  const validPlantIds = mappings
    .filter(m => m.material_id === materialId)
    .map(m => m.plant_id)
  
  const availablePlants = plants.filter(p => validPlantIds.includes(p.plant_id))
  const selectedMaterial = materials.find(m => m.material_id === materialId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        material_id: materialId,
        plant_id: plantId,
        quantity: Number(quantity),
        required_date: requiredDate,
        requestor_name: 'Eleanor Vance',
        requestor_email: 'eleanor@procureai.com'
      }

      const res = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create PR')
      }

      // Redirect to PR details or dashboard
      router.push(`/pr/${data.data.pr_id}`)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Main Form Form */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <div className="bg-blue-100 p-1.5 rounded text-blue-700">
            <Box className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Material & Plant Specifications</h2>
          <span className="text-xs text-slate-400 ml-auto">* All parameters verified via Master Data</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Material */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-900">Material Item / SKU <span className="text-red-500">*</span></label>
              <button type="button" className="text-xs font-medium text-blue-600">Browse Catalog Master</button>
            </div>
            <select 
              required
              value={materialId}
              onChange={(e) => {
                setMaterialId(e.target.value)
                setPlantId('') // Reset plant on material change
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a material...</option>
              {materials.map(m => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_name} ({m.material_id})
                </option>
              ))}
            </select>
            {selectedMaterial && (
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">UNSPSC: {selectedMaterial.material_group}</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">Class: Direct Raw Material</span>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">Criticality: High (A-Level)</span>
              </div>
            )}
          </div>

          {/* Plant */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Destination Plant & Storage Location <span className="text-red-500">*</span></label>
            <select 
              required
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              disabled={!materialId}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="" disabled>Select plant...</option>
              {availablePlants.map(p => (
                <option key={p.plant_id} value={p.plant_id}>
                  {p.plant_name} ({p.plant_id}) - {p.location}
                </option>
              ))}
            </select>
            {materialId && availablePlants.length === 0 && (
              <p className="text-xs text-red-500 mt-1">This material is not mapped to any active plants.</p>
            )}
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-900">Required Quantity <span className="text-red-500">*</span></label>
                <span className="text-xs text-slate-400">MOQ: 500 {selectedMaterial?.unit_of_measure || 'UN'}</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md pl-3 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. 1500"
                />
                <div className="absolute right-2 top-2 text-xs font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                  {selectedMaterial?.unit_of_measure || 'UN'}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">Estimated Lot Weight: ~1.5 Metric Tons</p>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-900">Required on Site <span className="text-red-500">*</span></label>
                <span className="text-xs font-medium text-blue-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Standard Lead: 7d</span>
              </div>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">Delivery buffer: +2 days contingency</p>
            </div>
          </div>

          {/* Justification */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-900">Business Purpose & Allocation Justification <span className="text-red-500">*</span></label>
              <button type="button" className="text-xs font-medium text-purple-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Auto-draft from Work Order</button>
            </div>
            <textarea 
              required
              rows={3}
              defaultValue="Q4 Chassis Structural Stamping run batch #419. Fremont Giga line requires immediate replenishment due to planned velocity acceleration under Work Order WO-8921-X."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-500 font-medium">Ref: SAP-WO-8921-X</span>
              <span className="text-xs text-slate-400">138 / 500 characters</span>
            </div>
          </div>

          {/* Pre-Flight Checks */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Activity className="w-4 h-4 text-blue-600" /> Instant System Pre-Flight
              </div>
              <span className="bg-white border border-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                3/3 Checks Pass
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded p-2.5 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Valid Catalog SKU</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{materialId || 'MAT-8491'} Active</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2.5 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Plant Mapping</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{plantId || 'Plant 1002'} Compatible</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2.5 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">No Duplicate PR</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Clean for 48h</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div className="flex gap-3">
              <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-md hover:bg-slate-200 transition-colors">Save Draft</button>
              <button type="button" onClick={() => router.push('/')} className="px-4 py-2 text-slate-500 font-medium text-sm hover:text-slate-700 transition-colors">Cancel</button>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit & Trigger AI Pipeline'}
            </button>
          </div>
        </form>
      </div>

      {/* Side Panel */}
      <div className="w-80 space-y-4">
        {/* Sequence Plan */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Execution Sequence Plan</h3>
            <span className="text-[10px] text-slate-400 ml-auto">Architecture v3.2</span>
          </div>
          <div className="p-4 bg-slate-50 text-xs text-slate-600 mb-2">
            Once submitted, this requisition will progress through the four autonomous agent stages:
          </div>
          <div className="px-4 pb-4 space-y-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-md flex gap-3 relative overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <div>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="text-xs font-semibold text-slate-900">Agent 1 • Validation</div>
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Instant</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">Duplicates, Taxonomy classification, and Plant-Material parity</div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-3 rounded-md flex gap-3 relative overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <div>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="text-xs font-semibold text-purple-900">Inventory Check (Rule-based)</div>
                  <span className="text-[9px] bg-white text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">Deficit Detected</span>
                </div>
                <div className="text-[10px] text-purple-700 leading-tight">
                  Dynamic safety stock gap analysis and forecast integration
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-md flex gap-3 relative overflow-hidden opacity-75">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <div>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="text-xs font-semibold text-slate-700">Agent 2 • Sourcing Analysis</div>
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Queued</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">Match suppliers & rank quotes</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-md flex gap-3 relative overflow-hidden opacity-50">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">4</div>
              <div>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="text-xs font-semibold text-slate-700">Agent 3 & 4 • Decision Node</div>
                  <span className="text-[9px] text-slate-400">Final</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">Automated approval router</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-4">
              <span className="text-xs font-semibold text-slate-700">Est. Pipeline Turnaround:</span>
              <span className="text-xs font-bold text-blue-600">~4.2 seconds end-to-end</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
