/**
 * ProgressionState tracks the progression state for a specific exercise.
 * This maintains the current weight, failure streak, and progression settings.
 */
export interface ProgressionState {
  /** Unique identifier for this progression state (UUID format) */
  id: string

  /** Reference to the ExerciseDefinition this progression state belongs to */
  exerciseDefinitionId: string

  /** Current weight being used for this exercise */
  currentWeight: number

  /** Number of consecutive workout failures (increments on workout failure, resets on success) */
  failureStreak: number

  /** Optional date of the last workout for this exercise */
  lastWorkoutDate?: Date

  /** Weight increment used for progression (e.g., 2.5 for kg, 5 for lb) */
  plateIncrement: number

  /** Unit of measurement for this exercise */
  unit: 'kg' | 'lb'
}

