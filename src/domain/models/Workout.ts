import type { ExerciseInstance } from './ExerciseInstance'

/**
 * Workout represents a single workout session containing multiple exercises.
 */
export interface Workout {
  /** Unique identifier for this workout (UUID format) */
  id: string

  /** UTC timestamp (ms since epoch) when this workout occurred */
  dateMs: number

  /** Array of exercise instances performed in this workout */
  exerciseInstances: ExerciseInstance[]

  /** Workout variation for program rotation */
  variation: 'A' | 'B'

  /** Whether this workout has been soft-deleted */
  deleted?: boolean

  /** Timestamp when this workout session was started (ms since epoch) */
  startedAtMs?: number

  /** Timestamp when this workout session was completed (ms since epoch) */
  completedAtMs?: number

  /** Optional notes for the entire workout */
  notes?: string

  /** Whether this workout has been completed */
  completed: boolean
}
