export interface PlateStack {
    /** Plates per side, sorted descending */
    platesPerSide: number[]
  
    /** Total weight including bar */
    totalWeight: number
  }
  
  export interface PlateCalculationResult {
    /** Final plate stack suggestion */
    stack: PlateStack
  
    /** Whether rounding was applied */
    rounded: boolean
  
    /** Difference between requested and achieved weight */
    delta: number
  }
  import type { PlateCalculatorConfig } from '../models/PlateCalculatorConfig'

  export function calculateSingleLifterPlates(
    targetWeight: number,
    config: PlateCalculatorConfig
  ): PlateCalculationResult {
    const {
      barWeight,
      availablePlates,
      roundingIncrement,
      minimumPlateWeight,
    } = config
  
    const targetLoad = targetWeight - barWeight
    if (targetLoad <= 0) {
      return {
        stack: { platesPerSide: [], totalWeight: barWeight },
        rounded: true,
        delta: targetWeight - barWeight,
      }
    }
  
    const perSideTarget = targetLoad / 2
    let remaining = perSideTarget
    const platesPerSide: number[] = []
  
    for (const plate of availablePlates) {
      if (plate < minimumPlateWeight) continue
  
      while (remaining >= plate) {
        platesPerSide.push(plate)
        remaining -= plate
      }
    }
  
    const achievedLoad = platesPerSide.reduce((a, b) => a + b, 0) * 2
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
    