import type { Workout } from '../models/Workout'

/**
 * Marks a workout as started if it hasn't been started yet.
 */
export function startWorkout(
  workout: Workout,
  nowMs: number
): Workout {
  if (workout.startedAtMs != null) {
    return workout
  }

  return {
    ...workout,
    startedAtMs: nowMs,
    completedAtMs: undefined,
    completed: false,
  }
}

/**
 * Marks a workout as completed if it hasn't been completed yet.
 */
export function finishWorkout(
  workout: Workout,
  nowMs: number
): Workout {
  if (workout.completedAtMs != null) {
    return workout
  }

  return {
    ...workout,
    completedAtMs: nowMs,
    completed: true,
  }
}

/**
 * Returns elapsed seconds for a completed workout, or null if invalid.
 */
export function calculateWorkoutElapsedSeconds(
  workout: Workout
): number | null {
  if (workout.startedAtMs == null) {
    return null
  }

  if (workout.completedAtMs == null) {
    return null
  }

  if (workout.completedAtMs < workout.startedAtMs) {
    return null
  }

  return Math.floor(
    (workout.completedAtMs - workout.startedAtMs) / 1000
  )
}
