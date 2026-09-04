// Inventory Check — Deterministic Business Logic
// Module 6 Implementation
// NO LLM. Pure deterministic arithmetic.

import type { InventoryResult } from '@/types'
import { createServerClient } from '@/lib/supabase'

/**
 * Pure calculation function for inventory check.
 * Usable stock = max(0, available_stock) - max(0, forecasted_demand)
 * Remaining after PR = usable_stock - pr_quantity
 * Status:
 *   - remaining_after_pr >= safety_stock -> 'SUFFICIENT'
 *   - remaining_after_pr >= 0 -> 'AT_RISK'
 *   - remaining_after_pr < 0 -> 'INSUFFICIENT'
 * invoke_agent2 = status !== 'SUFFICIENT'
 */
export function calculateInventoryResult({
  availableStock,
  safetyStock,
  forecastedDemand,
  prQuantity,
  hasInventoryRecord = true,
  hasForecastRecord = true,
}: {
  availableStock: number
  safetyStock: number
  forecastedDemand: number
  prQuantity: number
  hasInventoryRecord?: boolean
  hasForecastRecord?: boolean
}): InventoryResult {
  if (!hasInventoryRecord) {
    return {
      status: 'INSUFFICIENT',
      available_stock: 0,
      safety_stock: safetyStock || 0,
      forecasted_demand: 0,
      usable_stock: 0,
      pr_quantity: prQuantity,
      remaining_after_pr: -prQuantity,
      explanation: `No active inventory record found for the requested material and plant. External sourcing required to fulfill PR of ${prQuantity}.`,
      invoke_agent2: true,
    }
  }

  const cleanAvailable = Math.max(0, availableStock)
  const cleanSafety = Math.max(0, safetyStock)
  const cleanForecast = Math.max(0, forecastedDemand)
  const cleanPR = Math.max(0, prQuantity)

  const usableStock = cleanAvailable - cleanForecast
  const remainingAfterPR = usableStock - cleanPR

  let status: 'SUFFICIENT' | 'AT_RISK' | 'INSUFFICIENT'
  let explanation: string

  if (remainingAfterPR >= cleanSafety) {
    status = 'SUFFICIENT'
    explanation = `Available stock of ${cleanAvailable} minus forecast of ${cleanForecast} leaves ${usableStock} usable. After PR of ${cleanPR}, remaining is ${remainingAfterPR}, which satisfies the safety stock target of ${cleanSafety}. Stock is sufficient.`
  } else if (remainingAfterPR >= 0) {
    status = 'AT_RISK'
    explanation = `Available stock of ${cleanAvailable} minus forecast of ${cleanForecast} leaves ${usableStock} usable. After PR of ${cleanPR}, remaining is ${remainingAfterPR}, which is below safety stock target of ${cleanSafety}. Inventory is at risk; sourcing analysis recommended.`
  } else {
    status = 'INSUFFICIENT'
    explanation = `Available stock of ${cleanAvailable} minus forecast of ${cleanForecast} leaves ${usableStock} usable. After PR of ${cleanPR}, remaining is ${remainingAfterPR} (deficit of ${Math.abs(remainingAfterPR)}). Inventory is insufficient; vendor sourcing required.`
  }

  if (!hasForecastRecord) {
    explanation += ' (Note: No future demand forecast record was found; forecasted demand assumed 0.)'
  }

  return {
    status,
    available_stock: cleanAvailable,
    safety_stock: cleanSafety,
    forecasted_demand: cleanForecast,
    usable_stock: usableStock,
    pr_quantity: cleanPR,
    remaining_after_pr: remainingAfterPR,
    explanation,
    invoke_agent2: status !== 'SUFFICIENT',
  }
}

/**
 * Executes the database lookup and evaluates inventory sufficiency.
 */
export async function runInventoryCheck(
  materialId: string,
  plantId: string,
  prQuantity: number,
  customSupabaseClient?: any
): Promise<InventoryResult> {
  const supabase = customSupabaseClient || createServerClient()

  // 1. Fetch inventory record
  const { data: inv, error: invError } = await supabase
    .from('inventory')
    .select('available_stock, safety_stock')
    .eq('material_id', materialId)
    .eq('plant_id', plantId)
    .maybeSingle()

  if (invError) {
    console.error('Error fetching inventory:', invError)
  }

  if (!inv) {
    return calculateInventoryResult({
      availableStock: 0,
      safetyStock: 0,
      forecastedDemand: 0,
      prQuantity,
      hasInventoryRecord: false,
    })
  }

  // 2. Fetch nearest future demand forecast
  const todayISO = new Date().toISOString().split('T')[0]
  const { data: forecastList, error: forecastError } = await supabase
    .from('demand_forecast')
    .select('forecast_quantity, forecast_period')
    .eq('material_id', materialId)
    .eq('plant_id', plantId)
    .gte('forecast_period', todayISO)
    .order('forecast_period', { ascending: true })
    .limit(1)

  if (forecastError) {
    console.error('Error fetching demand forecast:', forecastError)
  }

  let forecastedDemand = 0
  let hasForecastRecord = false

  if (forecastList && forecastList.length > 0) {
    forecastedDemand = Number(forecastList[0].forecast_quantity) || 0
    hasForecastRecord = true
  } else {
    // Fallback: try to get any nearest forecast if no future date exists
    const { data: anyForecast } = await supabase
      .from('demand_forecast')
      .select('forecast_quantity')
      .eq('material_id', materialId)
      .eq('plant_id', plantId)
      .order('forecast_period', { ascending: false })
      .limit(1)

    if (anyForecast && anyForecast.length > 0) {
      forecastedDemand = Number(anyForecast[0].forecast_quantity) || 0
      hasForecastRecord = true
    }
  }

  return calculateInventoryResult({
    availableStock: Number(inv.available_stock) || 0,
    safetyStock: Number(inv.safety_stock) || 0,
    forecastedDemand,
    prQuantity,
    hasInventoryRecord: true,
    hasForecastRecord,
  })
}
