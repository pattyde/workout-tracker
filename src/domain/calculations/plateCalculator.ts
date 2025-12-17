import type { PlateCalculatorConfig } from '../models/PlateCalculatorConfig'

/* ============================================================================
 * Types
 * ========================================================================== */

export interface PlateStack {
  /** Plates per side, sorted descending */
  platesPerSide: number[]

  /** Total weight including bar */
  totalWeight: number
}

export interface PlateCalculationResult {
  stack: PlateStack
  rounded: boolean
  delta: number
}

/* ============================================================================
 * Single lifter calculation
 * ========================================================================== */

/**
 * Calculates the plate stack for a single lifter.
 * Always rounds down to the nearest achievable weight.
 */
export function calculateSingleLifterPlates(
  targetWeight: number,
  config: PlateCalculatorConfig
): PlateCalculationResult {
  const { barWeight, availablePlates, minimumPlateWeight } = config

  const targetLoad = targetWeight - barWeight

  // Bar-only or invalid target
  if (targetLoad <= 0) {
    return {
      stack: {
        platesPerSide: [],
        totalWeight: barWeight,
      },
      rounded: true,
      delta: targetWeight - barWeight,
    }
  }

  const perSideTarget = targetLoad / 2
  let remaining = perSideTarget
  const platesPerSide: number[] = []

  for (const plate of availablePlates) {
    if (plate < minimumPlateWeight) continue

    while (remaining + 1e-9 >= plate) {
      platesPerSide.push(plate)
      remaining -= plate
    }
  }

  const achievedLoad =
    platesPerSide.reduce((sum, p) => sum + p, 0) * 2

  const achievedTotal = achievedLoad + barWeight

  return {
    stack: {
      platesPerSide,
      totalWeight: achievedTotal,
    },
    rounded: achievedTotal !== targetWeight,
    delta: targetWeight - achievedTotal,
  }
}
