import type { Set } from './Set'

/**
 * ExerciseInstance represents a specific exercise performed in a workout.
 * This is the per-workout state that references an ExerciseDefinition.
 */
export interface ExerciseInstance {
  /** Unique identifier for this exercise instance (UUID format) */
  id: string

  /** Reference to the ExerciseDefinition that defines this exercise */
  exerciseDefinitionId: string

  /** Reference to the Workout that contains this exercise instance */
  workoutId: string

  /** Explicit ordering within the workout */
  orderIndex: number

  /**
   * Array of sets for this exercise, ordered with warmups first, then work sets.
   * Work-set weight is exercise-level by design; sets mirror that value.
   */
  sets: Set[]

  /** Work weight for this exercise instance (exercise-level source of truth) */
  workWeight: number

  /** Selected bar type for this exercise (persists across workouts) */
  barTypeId: string

  /** Whether shared-bar plate loading mode is enabled for this exercise */
  useSharedBarLoading: boolean

  /** Optional timestamp when this exercise was started (ms since epoch) */
  startedAtMs?: number

  /** Optional timestamp when this exercise was completed (ms since epoch) */
  completedAtMs?: number

  /** Optional notes specific to this exercise instance */
  notes?: string
}
