/**
 * Set represents a single set of an exercise (either warmup or work set).
 */
export interface Set {
  /** Unique identifier for this set (UUID format) */
  id: string

  /** Explicit ordering within the exercise */
  orderIndex: number

  /** Type of set: warmup or work set */
  type: 'warmup' | 'work'

  /** Whether this set is enabled (warmups default to false) */
  enabled: boolean

  /**
   * Target weight for this set.
   * For work sets, this mirrors the exercise-level work weight.
   */
  targetWeight: number

  /** Target number of repetitions */
  targetReps: number

  /** Actual weight lifted (for editing past workouts) */
  actualWeight?: number

  /** Actual number of repetitions completed (0 if failed) */
  actualReps?: number

  /**
   * Status of the set:
   * - pending: not attempted yet
   * - completed: successfully completed
   * - failed: attempted but did not meet target (actualReps = 0)
   */
  status: 'pending' | 'completed' | 'failed'

  /** Elapsed rest time after this set (seconds, stopwatch-based) */
  restElapsedSeconds?: number
}
