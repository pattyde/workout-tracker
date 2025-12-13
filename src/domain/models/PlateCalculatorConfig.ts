/**
 * PlateCalculatorConfig represents the configuration for calculating plate loading.
 * This defines the available plates, bar weight, and calculation mode.
 */
export interface PlateCalculatorConfig {
  /** Weight of the empty barbell */
  barWeight: number

  /** Array of available plate weights (typically sorted in descending order) */
  availablePlates: number[]

  /** Calculation mode: 'single' for one lifter, 'shared' for shared bar between lifters */
  mode: 'single' | 'shared'

  /** Unit of measurement for weights */
  unit: 'kg' | 'lb'
}

