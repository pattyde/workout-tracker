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

  /** Array of sets for this exercise, ordered with warmups first, then work sets */
  sets: Set[]

  /** Optional notes specific to this exercise instance */
  notes?: string
}

