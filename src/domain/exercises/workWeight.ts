import type { ExerciseInstance } from '../models/ExerciseInstance'

/**
 * Work weight is exercise-level by design.
 * Until a dedicated field exists, derive it from the first work set.
 */
export function getExerciseWorkWeight(
  exercise: ExerciseInstance
): number | null {
  return Number.isFinite(exercise.workWeight)
    ? exercise.workWeight
    : null
}
