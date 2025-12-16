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

  /** Optional notes for the entire workout */
  notes?: string

  /** Whether this workout has been completed */
  completed: boolean
}
