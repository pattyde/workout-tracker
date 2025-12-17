/**
 * PlateCalculatorConfig represents the configuration for calculating plate loading.
 * This defines bar selection, available plates, rounding rules, and calculation mode.
 */
export interface PlateCalculatorConfig {
  /** Identifier for the selected barbell (persists per exercise) */
  barId: string

  /** Weight of the selected empty barbell */
  barWeight: number

  /** Array of available plate weights (e.g., [25, 20, 15, 10, 5, 2.5]) */
  availablePlates: number[]

  /** Minimum plate weight to consider or display (e.g., 0.625kg) */
  minimumPlateWeight: number

  /** Rounding increment for target weights (e.g., 0.5kg or 1lb) */
  roundingIncrement: number

  /** Unit of measurement */
  unit: 'kg' | 'lb'
}
