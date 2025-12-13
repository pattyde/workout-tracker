/**
 * StopwatchState represents the state of a count-up stopwatch timer.
 * This is a single global timer that tracks elapsed time with alert intervals.
 */
export interface StopwatchState {
  /** Unique identifier for this stopwatch (UUID format) */
  id: string

  /** Timestamp when the stopwatch was started (null if not started) */
  startTime: number | null

  /** Accumulated elapsed time in seconds when paused */
  pausedTime: number

  /** Array of alert intervals in seconds (e.g., [60, 120, 180]) */
  alertIntervals: number[]

  /** Set of alert intervals that have already fired (to prevent duplicate alerts) */
  firedAlerts: Set<number>

  /** Whether the user has dismissed the stopwatch */
  dismissed: boolean

  /** Whether the stopwatch is currently running */
  isRunning: boolean

  /**
   * Computed property (not stored):
   * elapsedSeconds = (now - startTime) + pausedTime if running
   * elapsedSeconds = pausedTime if paused
   */
  // elapsedSeconds: number
}

