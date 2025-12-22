import { describe, it, expect } from 'vitest'
import { calculateSingleLifterPlates } from './plateCalculator'
import type { PlateCalculatorConfig } from '../models/PlateCalculatorConfig'

describe('Plate Calculator – Single Lifter', () => {
  const baseConfig: PlateCalculatorConfig = {
    barId: 'olympic',
    barWeight: 20,
    availablePlates: [25, 20, 15, 10, 5, 2.5],
    minimumPlateWeight: 2.5,
    roundingIncrement: 2.5,
    unit: 'kg',
  }

  it('calculates exact load with standard plates', () => {
    const result = calculateSingleLifterPlates(60, baseConfig)

    expect(result.stack.platesPerSide).toEqual([20])
    expect(result.stack.totalWeight).toBe(60)
    expect(result.rounded).toBe(false)
  })

  it('rounds down when exact load is not possible', () => {
    const result = calculateSingleLifterPlates(62.5, baseConfig)

    expect(result.stack.totalWeight).toBe(60)
    expect(result.rounded).toBe(true)
    expect(result.delta).toBe(2.5)
  })

  it('returns bar only when target weight is below bar weight', () => {
    const result = calculateSingleLifterPlates(15, baseConfig)

    expect(result.stack.platesPerSide).toEqual([])
    expect(result.stack.totalWeight).toBe(20)
    expect(result.rounded).toBe(true)
  })

  it('ignores plates smaller than minimumPlateWeight', () => {
    const config = {
      ...baseConfig,
      availablePlates: [2.5, 1.25],
      minimumPlateWeight: 2.5,
    }

    const result = calculateSingleLifterPlates(25, config)

    expect(result.stack.platesPerSide).toEqual([2.5])
  })
})
// describe('Plate Calculator – Shared Bar', () => {
//     const config: PlateCalculatorConfig = {
//       barId: 'olympic',
//       barWeight: 20,
//       availablePlates: [20, 10, 5, 2.5],
//       minimumPlateWeight: 2.5,
//       roundingIncrement: 2.5,
//       mode: 'shared',
//       optimizeForMinimalPlateChanges: true,
//       unit: 'kg',
//     }
  
//     it('minimises plate changes between two lifters', () => {
//       // Lifter A: 60kg → 20 per side
//       // Lifter B: 50kg → 15 per side
//       const result = calculateSharedBarPlates(60, 50, config)
  
//       expect(result.sharedBasePlates).toEqual([10, 5])
//       expect(result.plateChangesPerSide).toBe(1)
//     })
  
//     it('falls back to independent calculation when optimisation is off', () => {
//       const nonOptimised = {
//         ...config,
//         optimizeForMinimalPlateChanges: false,
//       }
  
//       const result = calculateSharedBarPlates(60, 50, nonOptimised)
  
//       expect(result.lifterA.stack.platesPerSide).toEqual([20])
//       expect(result.lifterB.stack.platesPerSide).toEqual([10, 5])
//     })
//   })
  
