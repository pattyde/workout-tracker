import type { Workout } from '../models/Workout'

export function getNextWorkoutVariation(
  workouts: Workout[]
): Workout['variation'] {
  if (workouts.length === 0) {
    return 'A'
  }

  let latest: Workout | null = null

  for (const workout of workouts) {
    if (!workout.completed) {
      continue
    }

    if (workout.completedAtMs == null) {
      continue
    }

    if (!latest) {
      latest = workout
      continue
    }

    if (
      latest.completedAtMs != null &&
      workout.completedAtMs > latest.completedAtMs
    ) {
      latest = workout
    }
  }

  if (!latest) {
    return 'A'
  }

  return latest.variation === 'A' ? 'B' : 'A'
}
