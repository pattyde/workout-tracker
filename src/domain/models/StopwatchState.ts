/**
 * StopwatchState represents a count-up stopwatch.
 * It is time-based, not tick-based.
 */
export interface StopwatchState {
  /** When the stopwatch was started (epoch ms), or null if not running */
  startTime: number | null

  /** Accumulated elapsed time in milliseconds when paused */
  accumulatedMs: number

  /** Alert thresholds in seconds (e.g. [90, 180, 300]) */
  alertThresholdsSec: number[]

  /** Thresholds that have already fired */
  firedThresholdsSec: number[]

  /** Whether the stopwatch has been dismissed */
  dismissed: boolean
}
