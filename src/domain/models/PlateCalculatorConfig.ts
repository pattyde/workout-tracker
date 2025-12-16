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

  /**
   * Calculation mode:
   * - 'single': one lifter
   * - 'shared': shared bar between two lifters
   */
  mode: 'single' | 'shared'

  /**
   * Companion lifter's work weight (used only in shared mode).
   * Lifter A is assumed to be the app user.
   */
  sharedLifterWeight?: number

  /**
   * Whether to optimise plate selection to minimise plate changes
   * between lifters in shared mode.
   */
  optimizeForMinimalPlateChanges: boolean

  /** Unit of measurement */
  unit: 'kg' | 'lb'
}
