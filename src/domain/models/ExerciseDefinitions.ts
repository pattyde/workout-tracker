/**
 * ExerciseDefinition represents a reusable exercise template.
 * This is the persistent definition that can be referenced across multiple workouts.
 */
export interface ExerciseDefinition {
  /** Unique identifier for the exercise definition (UUID format) */
  id: string

  /** Display name of the exercise (e.g., "Barbell Squat", "Bench Press") */
  name: string

  /** Default weight increment for progression (e.g., 2.5 for kg, 5 for lb) */
  defaultPlateIncrement: number

  /** Default unit of measurement for this exercise */
  defaultUnit: 'kg' | 'lb'

  /** Optional default rest time in seconds between sets */
  defaultRestSeconds?: number

  /** UTC timestamp (ms since epoch) when this definition was created */
  createdAtMs: number

  /** Whether this exercise is archived (hidden from new workouts but kept for history) */
  archived: boolean
}
