/**
 * Set represents a single set of an exercise (either warmup or work set).
 */
export interface Set {
  /** Unique identifier for this set (UUID format) */
  id: string

  /** Type of set: warmup or work set */
  type: 'warmup' | 'work'

  /** Target weight for this set */
  targetWeight: number

  /** Target number of repetitions */
  targetReps: number

  /** Actual weight lifted (for editing past workouts) */
  actualWeight?: number

  /** Actual number of repetitions completed (for editing past workouts) */
  actualReps?: number

  /** Whether this set has been completed */
  completed: boolean

  /** Optional rest time in seconds for this set (for rest timer) */
  restSeconds?: number
}

