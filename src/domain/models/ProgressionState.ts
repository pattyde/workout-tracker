/**
 * ProgressionState tracks the progression state for a specific exercise.
 * This maintains the current weight, failure streak, and progression settings.
 */
export interface ProgressionState {
  /** Unique identifier for this progression state (UUID format) */
  id: string

  /** Reference to the ExerciseDefinition this progression state belongs to */
  exerciseDefinitionId: string

  /** Current work weight being used for this exercise */
  currentWeight: number

  /** Previous weight before last progression or deload */
  previousWeight?: number

  /**
   * Number of consecutive workout failures
   * - increments on failed workout
   * - resets to 0 on success
   */
  failureStreak: number

  /** Date of the most recent workout for this exercise */
  lastWorkoutDate?: Date

  /** Date when a deload was last applied */
  lastDeloadDate?: Date

  /** Weight increment used for progression (e.g., 2.5kg, 5lb) */
  plateIncrement: number

  /** Unit of measurement for this exercise */
  unit: 'kg' | 'lb'

  /** Preferred bar type for future workouts (defaults to olympic-20kg) */
  preferredBarTypeId?: string
}
