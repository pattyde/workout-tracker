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
 * Returns elapsed milliseconds for a workout, or null if it hasn't started.
 */
export function getWorkoutElapsedMs(
  workout: Workout,
  nowMs: number
): number | null {
  if (workout.startedAtMs == null) {
    return null
  }

  const endMs = workout.completedAtMs ?? nowMs
  return Math.max(0, endMs - workout.startedAtMs)
}
