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
    mode: 'single',
    optimizeForMinimalPlateChanges: false,
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
