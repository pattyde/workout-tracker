/**
 * StopwatchState represents the state of a count-up stopwatch timer.
 */
export interface StopwatchState {
  /** Unique identifier for this stopwatch */
  id: string

  /** Associated workout (if any) */
  workoutId?: string

  /** Associated exercise instance (if any) */
  exerciseInstanceId?: string

  /** Timestamp when the stopwatch was started (null if stopped) */
  startTime: number | null

  /** Accumulated elapsed time in seconds when paused */
  pausedTime: number

  /** Alert intervals in seconds (e.g., [90, 180, 300]) */
  alertIntervals: number[]

  /** Alert intervals that have already fired */
  firedAlertSeconds: number[]

  /** Whether the user has dismissed the stopwatch */
  dismissed: boolean

  /** Whether the stopwatch is currently running */
  isRunning: boolean
}
