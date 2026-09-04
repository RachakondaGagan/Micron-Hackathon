'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Calendar, Box, Activity, CheckCircle2, Clock, Network, AlertTriangle, Check, ArrowRight } from 'lucide-react'

type PRFormProps = {
  materials: any[]
  plants: any[]
  mappings: any[]
  inventory?: any[]
  forecasts?: any[]
}

export const TEAM_MEMBERS = [
  { name: 'Gagan Rachakonda', email: 'gaganrachakonda.work@gmail.com', role: 'Senior Buyer & Lead' },
  { name: 'Bhargav', email: 'buddarajubhargavavarma@gmail.com', role: 'Sourcing Planner' },
  { name: 'Nikitha', email: 'kunisettinikhita@gmail.com', role: 'Inventory Specialist' },
  { name: 'Ruthvik', email: 'ruthvikparimi2006@gmail.com', role: 'Financial Approver' },
]

export function PRForm({ materials = [], plants = [], mappings = [], inventory = [], forecasts = [] }: PRFormProps) {
  const router = useRouter()

  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)
  const currentMember = TEAM_MEMBERS[selectedMemberIndex]

  // Default to first material or seeded MAT-8491
  const defaultMaterial = materials.find(m => m.material_id === 'MAT-8491') || materials[0]
  const defaultMaterialId = defaultMaterial?.material_id || ''

  const [materialId, setMaterialId] = useState(defaultMaterialId)

  // Valid plants for the selected material
  const validPlants = useMemo(() => {
    if (!materialId) return plants
    const plantIdsForMaterial = mappings
      .filter(m => m.material_id === materialId)
      .map(m => m.plant_id)
    const filtered = plants.filter(p => plantIdsForMaterial.includes(p.plant_id))
    return filtered.length > 0 ? filtered : plants
  }, [materialId, mappings, plants])

  const defaultPlantId = validPlants[0]?.plant_id || plants[0]?.plant_id || ''
  const [plantId, setPlantId] = useState(defaultPlantId)

  const [quantity, setQuantity] = useState('1500')
  const [requiredDate, setRequiredDate] = useState('2025-11-15')
  const [justification, setJustification] = useState(
    'Q4 Chassis Structural Stamping run batch #419. Fremont Giga line requires immediate replenishment due to planned velocity acceleration under Work Order WO-8921-X.'
  )
  const [draftSaved, setDraftSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedMaterial = materials.find(m => m.material_id === materialId)
  const selectedPlant = plants.find(p => p.plant_id === plantId)

  // Live Stock Calculation
  const currentInventory = useMemo(() => {
    return inventory.find(inv => inv.material_id === materialId && inv.plant_id === plantId)
  }, [inventory, materialId, plantId])

  const currentForecast = useMemo(() => {
    return forecasts.find(f => f.material_id === materialId && f.plant_id === plantId)
  }, [forecasts, materialId, plantId])

  const stockOnHand = currentInventory ? Number(currentInventory.available_stock) : 850
  const safetyTarget = currentInventory ? Number(currentInventory.safety_stock) : 1200
  const forecastDemand = currentForecast ? Number(currentForecast.forecast_quantity) : 4200
  const reqQtyNum = Number(quantity) || 0
  const deficit = Math.max(0, safetyTarget - (stockOnHand - reqQtyNum))
  const isDeficit = stockOnHand - reqQtyNum < safetyTarget

  const handleMaterialChange = (newMatId: string) => {
    setMaterialId(newMatId)
    // Find valid plants for this new material
    const valid = mappings.filter(m => m.material_id === newMatId).map(m => m.plant_id)
    if (valid.length > 0 && !valid.includes(plantId)) {
      setPlantId(valid[0])
    }
  }

  const handleSaveDraft = () => {
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 3000)
  }

  const handleAutoDraft = () => {
    setJustification(
      `Emergency replenishment for Work Order WO-${Math.floor(1000 + Math.random() * 9000)}-X. Required to maintain safety run-rate at ${selectedPlant?.plant_name || 'Plant'} due to accelerated production schedule.`
    )
  }

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
        requestor_name: currentMember.name,
        requestor_email: currentMember.email,
        planner_name: 'Bhargav',
        planner_email: 'buddarajubhargavavarma@gmail.com',
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

      router.push(`/pr/${data.data.pr_id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase requisition')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
      {/* Left Column: Main Form */}
      <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-700 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Material & Plant Specifications</h2>
              <p className="text-xs text-slate-500">All parameters verified via Master Data & ERP Catalog</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 self-start sm:self-auto">
            * Direct ERP Linked
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {draftSaved && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Draft saved successfully to local session!</span>
            </div>
          )}

          {/* Requestor Persona */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Requisition Submitted By (Team Member Persona)
              </label>
              <span className="text-[11px] text-blue-600 font-medium">Assigned Planner: Bhargav</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEAM_MEMBERS.map((m, idx) => (
                <button
                  key={m.email}
                  type="button"
                  onClick={() => setSelectedMemberIndex(idx)}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                    selectedMemberIndex === idx
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{m.name}</div>
                  <div className={`text-[10px] truncate ${selectedMemberIndex === idx ? 'text-blue-100' : 'text-slate-500'}`}>
                    {m.role}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Material Item / SKU */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="material-select" className="text-sm font-semibold text-slate-900">
                Material Item / SKU <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentIndex = materials.findIndex(m => m.material_id === materialId)
                  const nextIndex = (currentIndex + 1) % (materials.length || 1)
                  if (materials[nextIndex]) handleMaterialChange(materials[nextIndex].material_id)
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Cycle Next SKU (Browse Catalog)
              </button>
            </div>
            <select
              id="material-select"
              required
              value={materialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
            >
              {materials.map(m => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_name} ({m.material_id}) — {m.material_group}
                </option>
              ))}
            </select>
            {selectedMaterial && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                  UNSPSC: {selectedMaterial.material_group}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">
                  Class: Direct Raw Material
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded border border-purple-100">
                  Criticality: High (A-Level)
                </span>
              </div>
            )}
          </div>

          {/* Destination Plant & Storage Location */}
          <div>
            <label htmlFor="plant-select" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Destination Plant & Storage Location <span className="text-red-500">*</span>
            </label>
            <select
              id="plant-select"
              required
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
            >
              {validPlants.map(p => (
                <option key={p.plant_id} value={p.plant_id}>
                  {p.plant_name} ({p.plant_id}) — {p.location}
                </option>
              ))}
            </select>
          </div>

          {/* Required Quantity & Required on Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="quantity-input" className="text-sm font-semibold text-slate-900">
                  Required Quantity <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500">MOQ: 500 {selectedMaterial?.unit_of_measure || 'KG'}</span>
              </div>
              <div className="relative">
                <input
                  id="quantity-input"
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 rounded-lg pl-3.5 pr-14 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="e.g. 1500"
                />
                <div className="absolute right-2.5 top-2.5 text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded pointer-events-none">
                  {selectedMaterial?.unit_of_measure || 'KG'}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Estimated weight: ~{(reqQtyNum / 1000).toFixed(1)} Metric Tons
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="date-input" className="text-sm font-semibold text-slate-900">
                  Required on Site <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Standard Lead: 7d
                </span>
              </div>
              <div className="relative">
                <input
                  id="date-input"
                  type="date"
                  required
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">Delivery buffer: +2 days contingency</p>
            </div>
          </div>

          {/* Business Purpose & Allocation Justification */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="justification-input" className="text-sm font-semibold text-slate-900">
                Business Purpose & Allocation Justification <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDraft}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" /> Auto-draft from Work Order
              </button>
            </div>
            <textarea
              id="justification-input"
              required
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="Describe business reason and work order context..."
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-500 font-medium">Ref: SAP-WO-8921-X</span>
              <span className="text-xs text-slate-400">{justification.length} / 500 characters</span>
            </div>
          </div>

          {/* Instant System Pre-Flight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Activity className="w-4 h-4 text-blue-600" /> Instant System Pre-Flight
              </div>
              <span className="bg-blue-100 border border-blue-200 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                3/3 Checks Pass
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Valid Catalog SKU</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{materialId || 'MAT-8491'} Active</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Plant Mapping</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{plantId || 'Plant 1002'} Compatible</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">No Duplicate PR</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Clean for 48h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 transition-colors"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 text-slate-500 font-medium text-sm hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Submitting Requisition...' : 'Submit & Trigger AI Pipeline'}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Stock Check & Execution Sequence Plan */}
      <div className="w-full xl:w-[420px] 2xl:w-[460px] shrink-0 space-y-5">
        {/* Live Stock Check Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md">
                <Box className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Live Stock Check</h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              Bay 4 Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">Current Stock</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stockOnHand.toLocaleString()} <span className="text-xs font-normal text-slate-500">{selectedMaterial?.unit_of_measure || 'KG'}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Physical verified</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">Safety Target</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {safetyTarget.toLocaleString()} <span className="text-xs font-normal text-slate-500">{selectedMaterial?.unit_of_measure || 'KG'}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">30-day buffer</div>
            </div>
          </div>

          {/* Deficit Spectrum Analysis */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-600">Deficit Spectrum Analysis</span>
              <span className={isDeficit ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                {isDeficit ? `-${deficit.toLocaleString()} ${selectedMaterial?.unit_of_measure || 'KG'} Deficit` : 'Stock Sufficient'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${Math.min(100, (stockOnHand / (safetyTarget || 1)) * 50)}%` }}
              />
              <div
                className={isDeficit ? 'bg-red-500 h-full' : 'bg-emerald-500 h-full'}
                style={{ width: `${Math.min(100, (deficit / (safetyTarget || 1)) * 50)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
              <span>On Hand: {stockOnHand.toLocaleString()}</span>
              <span>Target: {safetyTarget.toLocaleString()}</span>
            </div>
          </div>

          {/* Sourcing Alert */}
          {isDeficit ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-xs text-red-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-red-900">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Insufficient On-Hand (-{deficit.toLocaleString()} {selectedMaterial?.unit_of_measure || 'KG'} below safety)
              </div>
              <p className="leading-relaxed text-[11px] text-red-700">
                Autonomous inventory check will detect deficit. System will automatically hand off PR to{' '}
                <span className="font-semibold">Agent 2 (Sourcing Analysis)</span> upon submission.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sufficient on-hand stock. Fast-track internal fulfillment possible.</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">30-Day Demand Forecast:</span>
            <span className="font-semibold text-slate-800">{forecastDemand.toLocaleString()} {selectedMaterial?.unit_of_measure || 'KG'} (Rising)</span>
          </div>
        </div>

        {/* Execution Sequence Plan */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Execution Sequence Plan</h3>
            </div>
            <span className="text-[10px] text-slate-400">Architecture v3.2</span>
          </div>
          <p className="text-xs text-slate-500">
            Once submitted, this requisition will progress through four autonomous agent stages:
          </p>
          <div className="space-y-2.5">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-900">Agent 1 • Validation</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">Instant</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Duplicates, Taxonomy classification, and Plant-Material parity</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-purple-900">Inventory Check (Rule-based)</span>
                  <span className="text-[10px] bg-white text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 font-medium">Deficit Detected</span>
                </div>
                <p className="text-[11px] text-purple-700 leading-tight mt-0.5">Dynamic safety stock gap analysis & forecast integration</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-800">Agent 2 • Sourcing Analysis</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100 font-medium">Queued</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Match suppliers & rank quotes</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-800">Agent 3 & 4 • Decision Node</span>
                  <span className="text-[10px] text-slate-400 font-medium">Final</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Automated approval router & notification</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-600">Est. Pipeline Turnaround:</span>
            <span className="font-bold text-blue-600">~4.2 seconds end-to-end</span>
          </div>
        </div>
      </div>
    </div>
  )
}
