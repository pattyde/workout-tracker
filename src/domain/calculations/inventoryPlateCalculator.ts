import type { EquipmentInventoryPlate } from '../models/AppState'

export interface InventoryPlateStackItem {
  weight: number
  count: number
}

export interface InventoryPlateStack {
  platesPerSide: InventoryPlateStackItem[]
  totalWeight: number
}

export interface InventoryPlateCalculationResult {
  stack: InventoryPlateStack
  rounded: boolean
  delta: number
}

export function calculateInventoryPlateStack(params: {
  targetWeight: number
  barWeight: number
  plates: EquipmentInventoryPlate[]
  unit: 'kg' | 'lb'
}): InventoryPlateCalculationResult {
  const { targetWeight, barWeight, plates, unit } = params
  const targetLoad = targetWeight - barWeight

  if (targetLoad <= 0) {
    return {
      stack: {
        platesPerSide: [],
        totalWeight: barWeight,
      },
      rounded: targetWeight !== barWeight,
      delta: targetWeight - barWeight,
    }
  }

  const perSideTarget = targetLoad / 2
  let remaining = perSideTarget
  const platesPerSide: InventoryPlateStackItem[] = []

  const available = plates
    .filter(plate => plate.unit === unit && plate.quantity > 0)
    .sort((a, b) => b.weight - a.weight)

  for (const plate of available) {
    const perSideAvailable = Math.floor(plate.quantity / 2)
    if (perSideAvailable <= 0) {
      continue
    }
    const maxByWeight = Math.floor(
      (remaining + 1e-9) / plate.weight
    )
    const count = Math.min(perSideAvailable, maxByWeight)
    if (count <= 0) {
      continue
    }
    platesPerSide.push({
      weight: plate.weight,
      count,
    })
    remaining -= plate.weight * count
  }

  const achievedLoad =
    platesPerSide.reduce(
      (sum, plate) => sum + plate.weight * plate.count,
      0
    ) * 2

  const achievedTotal = barWeight + achievedLoad

  return {
    stack: {
      platesPerSide,
      totalWeight: achievedTotal,
    },
    rounded: achievedTotal !== targetWeight,
    delta: targetWeight - achievedTotal,
  }
}
