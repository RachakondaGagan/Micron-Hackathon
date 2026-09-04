'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Package,
  Layers,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Download,
  Building2,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Cpu
} from 'lucide-react'

interface Material {
  material_id: string
  material_name: string
  material_group: string
  unit_of_measure: string
}

interface Plant {
  plant_id: string
  plant_name: string
  location: string
}

interface InventoryItem {
  inventory_id: string
  material_id: string
  plant_id: string
  available_stock: number
  safety_stock: number
  maximum_stock: number
  material_name: string
  unit_of_measure: string
  plant_name: string
  forecasted_demand: number
  usable_stock: number
  open_po_quantity: number
}

interface InventoryDashboardClientProps {
  inventory: InventoryItem[]
  materials: Material[]
  plants: Plant[]
  recentPos: any[]
}

export function InventoryDashboardClient({
  inventory,
  materials,
  plants,
  recentPos
}: InventoryDashboardClientProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('ALL')
  const [selectedPlantId, setSelectedPlantId] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Filtered inventory rows
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchMaterial = selectedMaterialId === 'ALL' || item.material_id === selectedMaterialId
      const matchPlant = selectedPlantId === 'ALL' || item.plant_id === selectedPlantId
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.material_name.toLowerCase().includes(q) ||
        item.material_id.toLowerCase().includes(q) ||
        item.plant_name.toLowerCase().includes(q) ||
        item.plant_id.toLowerCase().includes(q)

      return matchMaterial && matchPlant && matchSearch
    })
  }, [inventory, selectedMaterialId, selectedPlantId, searchQuery])

  // Current selected material metadata
  const currentMaterial = useMemo(() => {
    if (selectedMaterialId === 'ALL') return null
    return materials.find(m => m.material_id === selectedMaterialId) || null
  }, [materials, selectedMaterialId])

  // Compute KPI metrics dynamically based on filtered set or selected material
  const metrics = useMemo(() => {
    const isSingleMaterial = selectedMaterialId !== 'ALL'
    const uom = currentMaterial?.unit_of_measure || 'units'

    const available = filteredInventory.reduce((sum, i) => sum + Number(i.available_stock || 0), 0)
    const safety = filteredInventory.reduce((sum, i) => sum + Number(i.safety_stock || 0), 0)
    const forecast = filteredInventory.reduce((sum, i) => sum + Number(i.forecasted_demand || 0), 0)
    const usable = filteredInventory.reduce((sum, i) => sum + Number(i.usable_stock || 0), 0)

    // Stock line health counts
    let sufficientCount = 0
    let atRiskCount = 0
    let criticalCount = 0

    filteredInventory.forEach(item => {
      if (item.usable_stock < 0) {
        criticalCount++
      } else if (item.available_stock < Number(item.safety_stock)) {
        atRiskCount++
      } else {
        sufficientCount++
      }
    })

    return {
      isSingleMaterial,
      uom,
      available,
      safety,
      forecast,
      usable,
      sufficientCount,
      atRiskCount,
      criticalCount,
      totalLines: filteredInventory.length,
      openPoCount: recentPos.length
    }
  }, [filteredInventory, selectedMaterialId, currentMaterial, recentPos])

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Material ID', 'Material Name', 'Plant ID', 'Plant Name', 'Available Stock', 'Safety Floor', '30d Forecast Demand', 'Usable Buffer', 'UOM', 'Status']
    const rows = filteredInventory.map(item => {
      const isInsufficient = item.usable_stock < 0
      const isAtRisk = !isInsufficient && item.available_stock < Number(item.safety_stock)
      const status = isInsufficient ? 'INSUFFICIENT' : isAtRisk ? 'AT_RISK' : 'SUFFICIENT'
      return [
        `"${item.material_id}"`,
        `"${item.material_name}"`,
        `"${item.plant_id}"`,
        `"${item.plant_name}"`,
        item.available_stock,
        item.safety_stock,
        item.forecasted_demand,
        item.usable_stock,
        `"${item.unit_of_measure}"`,
        `"${status}"`
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `micron_inventory_${selectedMaterialId}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Interactive Material & Fab Scope Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Material & Plant Selectors */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700 font-medium text-xs sm:text-sm shrink-0">
              <Filter className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Filter Scope:</span>
            </div>

            {/* Material Dropdown */}
            <div className="relative min-w-[220px]">
              <select
                aria-label="Filter by Material"
                value={selectedMaterialId}
                onChange={e => setSelectedMaterialId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="ALL">All Materials ({materials.length} SKUs Portfolio)</option>
                {materials.map(m => (
                  <option key={m.material_id} value={m.material_id}>
                    {m.material_name} ({m.unit_of_measure})
                  </option>
                ))}
              </select>
            </div>

            {/* Plant Dropdown */}
            <div className="relative min-w-[190px]">
              <select
                aria-label="Filter by Plant"
                value={selectedPlantId}
                onChange={e => setSelectedPlantId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="ALL">All Micron Fabs ({plants.length} Locations)</option>
                {plants.map(p => (
                  <option key={p.plant_id} value={p.plant_id}>
                    {p.plant_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search and Quick Actions */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search chemical, wafer, fab..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs whitespace-nowrap shrink-0"
              title="Export filtered inventory to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {(selectedMaterialId !== 'ALL' || selectedPlantId !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedMaterialId('ALL')
                  setSelectedPlantId('ALL')
                  setSearchQuery('')
                }}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                title="Reset filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Material Chip Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedMaterialId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedMaterialId === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Materials
          </button>
          {materials.map(mat => (
            <button
              key={mat.material_id}
              onClick={() => setSelectedMaterialId(mat.material_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedMaterialId === mat.material_id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{mat.material_name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedMaterialId === mat.material_id ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {mat.unit_of_measure}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scope Banner if Filtered */}
      {selectedMaterialId !== 'ALL' && currentMaterial && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-600">Active Material Scope: </span>
              <strong className="text-slate-900 font-semibold">{currentMaterial.material_name}</strong>
              <span className="text-blue-700 font-mono ml-1.5 font-bold">({currentMaterial.material_id})</span>
              <span className="text-slate-400 mx-2">•</span>
              <span className="text-slate-600">Unit of Measure: </span>
              <span className="font-mono font-semibold bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 text-xs">
                {currentMaterial.unit_of_measure}
              </span>
            </div>
          </div>
          <Link
            href={`/pr/new?material_id=${currentMaterial.material_id}${selectedPlantId !== 'ALL' ? `&plant_id=${selectedPlantId}` : ''}`}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs shrink-0 self-end sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Requisition This Material</span>
          </Link>
        </div>
      )}

      {/* 5 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Available Stock / Monitored SKUs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {metrics.isSingleMaterial ? 'Available Stock' : 'Materials Monitored'}
            </div>
            <div className="bg-blue-50 p-1.5 rounded-md text-blue-600">
              {metrics.isSingleMaterial ? <Package className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.isSingleMaterial ? (
              <>
                {metrics.available.toLocaleString()}{' '}
                <span className="text-sm font-normal text-slate-500">{metrics.uom}</span>
              </>
            ) : (
              <>
                {materials.length}{' '}
                <span className="text-sm font-normal text-slate-500">Semiconductor SKUs</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-4">
            {metrics.isSingleMaterial
              ? `Across ${filteredInventory.length} stocking fabs`
              : `${inventory.length} global fab stocking points`}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-xs font-medium flex items-center">
              <Activity className="w-3 h-3 mr-1" />
              {metrics.isSingleMaterial ? '+5.2% trend' : '100% Active'}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
              Healthy
            </span>
          </div>
        </div>

        {/* Card 2: Safety Floor / Buffer Integrity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {metrics.isSingleMaterial ? 'Safety Stock' : 'Buffer Integrity'}
            </div>
            <div className="bg-purple-50 p-1.5 rounded-md text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.isSingleMaterial ? (
              <>
                {metrics.safety.toLocaleString()}{' '}
                <span className="text-sm font-normal text-slate-500">{metrics.uom}</span>
              </>
            ) : (
              <>
                {metrics.sufficientCount} / {metrics.totalLines}{' '}
                <span className="text-sm font-normal text-slate-500">Lines</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-4">
            {metrics.isSingleMaterial ? 'Threshold floor reserve' : `${metrics.atRiskCount} at risk • ${metrics.criticalCount} critical`}
          </div>
          <div className="flex items-center gap-2">
            {metrics.criticalCount > 0 ? (
              <>
                <span className="text-rose-600 text-xs font-medium flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> Shortage
                </span>
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {metrics.criticalCount} Alert
                </span>
              </>
            ) : (
              <>
                <span className="text-indigo-600 text-xs font-medium flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Fixed Baseline
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Guarded
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 3: 30d Forecast Demand / AI Model Run-Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {metrics.isSingleMaterial ? 'Forecast Demand' : '30-Day Forecast'}
            </div>
            <div className="bg-blue-50 p-1.5 rounded-md text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.isSingleMaterial ? (
              <>
                {metrics.forecast.toLocaleString()}{' '}
                <span className="text-sm font-normal text-slate-500">{metrics.uom}</span>
              </>
            ) : (
              <>
                {filteredInventory.filter(i => i.forecasted_demand > 0).length}{' '}
                <span className="text-sm font-normal text-slate-500">Fab Demand Lines</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-4">
            {metrics.isSingleMaterial ? 'Next 30 days cleanroom consumption' : 'Cross-fab cleanroom schedule'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xs font-medium flex items-center">
              <Cpu className="w-3 h-3 mr-1" /> AI Model v4.2
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
              Predictive
            </span>
          </div>
        </div>

        {/* Card 4: Open POs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open POs</div>
            <div className="bg-indigo-50 p-1.5 rounded-md text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.openPoCount}{' '}
            <span className="text-sm font-normal text-slate-500">Active</span>
          </div>
          <div className="text-xs text-slate-500 mb-4">Pending cleanroom delivery</div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs font-medium flex items-center">SAP S/4HANA</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
              In Transit
            </span>
          </div>
        </div>

        {/* Card 5: Usable Stock / Fab Network Coverage */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {metrics.isSingleMaterial ? 'Available to Use' : 'Fab Network'}
            </div>
            <div className="bg-emerald-50 p-1.5 rounded-md text-emerald-600">
              {metrics.isSingleMaterial ? <CheckCircle2 className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.isSingleMaterial ? (
              <>
                <span className={metrics.usable < 0 ? 'text-rose-600' : 'text-slate-900'}>
                  {metrics.usable.toLocaleString()}
                </span>{' '}
                <span className="text-sm font-normal text-slate-500">{metrics.uom}</span>
              </>
            ) : (
              <>
                {plants.length}{' '}
                <span className="text-sm font-normal text-slate-500">Global Fabs</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-4">
            {metrics.isSingleMaterial
              ? metrics.usable < 0
                ? 'Deficit vs 30d forecast'
                : 'Unallocated cleanroom buffer'
              : 'Boise, Hiroshima, SG, Taichung, Sanand'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-xs font-medium flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {metrics.isSingleMaterial
                ? metrics.usable < 0
                  ? 'Replenish Needed'
                  : 'Sufficient'
                : 'Operational'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                metrics.isSingleMaterial && metrics.usable < 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {metrics.isSingleMaterial && metrics.usable < 0 ? 'Action Req' : 'Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* Micron Semiconductor Inventory Health Table */}
      <div id="inventory-health" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden scroll-mt-20">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Fab Inventory Health & Buffer Monitoring</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live inventory levels, safety thresholds, and 30-day forecast demand across Micron semiconductor fabrication plants.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-full border border-slate-200 font-medium shadow-2xs">
              Showing {filteredInventory.length} of {inventory.length} Stock Lines
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Material / Chemical</th>
                <th className="px-6 py-4 font-semibold">Micron Fab / Facility</th>
                <th className="px-6 py-4 font-semibold text-right">Available Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Safety Floor</th>
                <th className="px-6 py-4 font-semibold text-right">30d Forecast</th>
                <th className="px-6 py-4 font-semibold text-right">Usable Buffer</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map(item => {
                const isInsufficient = item.usable_stock < 0
                const isAtRisk = !isInsufficient && item.available_stock < Number(item.safety_stock)
                const isSufficient = !isInsufficient && !isAtRisk

                return (
                  <tr key={`${item.material_id}-${item.plant_id}`} className="hover:bg-slate-50 transition-colors">
                    {/* Material */}
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMaterialId(item.material_id)}
                          className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors"
                          title="Filter dashboard by this material"
                        >
                          {item.material_name}
                        </button>
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.unit_of_measure}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{item.material_id}</div>
                    </td>

                    {/* Plant */}
                    <td className="px-6 py-4 text-slate-700">
                      <button
                        onClick={() => setSelectedPlantId(item.plant_id)}
                        className="font-medium text-slate-900 hover:text-blue-600 text-left transition-colors"
                        title="Filter dashboard by this fab"
                      >
                        {item.plant_name}
                      </button>
                      <div className="text-xs text-slate-400">{item.plant_id}</div>
                    </td>

                    {/* Available Stock */}
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                      {Number(item.available_stock).toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">{item.unit_of_measure}</span>
                    </td>

                    {/* Safety Floor */}
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {Number(item.safety_stock).toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">{item.unit_of_measure}</span>
                    </td>

                    {/* 30d Forecast */}
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {Number(item.forecasted_demand || 0).toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">{item.unit_of_measure}</span>
                    </td>

                    {/* Usable Stock */}
                    <td
                      className={`px-6 py-4 text-right font-mono font-bold ${
                        item.usable_stock < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {Number(item.usable_stock).toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">{item.unit_of_measure}</span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isSufficient
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isAtRisk
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isSufficient ? 'bg-emerald-500' : isAtRisk ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                        {isSufficient ? 'SUFFICIENT' : isAtRisk ? 'AT RISK' : 'INSUFFICIENT'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/pr/new?material_id=${item.material_id}&plant_id=${item.plant_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition-all shadow-2xs whitespace-nowrap"
                      >
                        <span>Requisition</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-sm">
                    No semiconductor materials found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
