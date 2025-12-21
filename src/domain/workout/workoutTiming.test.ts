import { describe, it, expect } from 'vitest'
import {
  startWorkout,
  finishWorkout,
  calculateWorkoutElapsedSeconds,
} from './workoutTiming'
import type { Workout } from '../models/Workout'

function makeWorkout(
  overrides: Partial<Workout> = {}
): Workout {
  return {
    id: 'workout-1',
    dateMs: 0,
    exerciseInstances: [],
    variation: 'A',
    completed: false,
    ...overrides,
  }
}

describe('workout timing', () => {
  it('starts a workout when not started yet', () => {
    const workout = makeWorkout()
    const result = startWorkout(workout, 1000)

    expect(result.startedAtMs).toBe(1000)
    expect(result.completedAtMs).toBeUndefined()
    expect(result.completed).toBe(false)
  })

  it('does not restart a workout that already started', () => {
    const workout = makeWorkout({ startedAtMs: 500 })
    const result = startWorkout(workout, 1000)

    expect(result).toBe(workout)
  })

  it('finishes a workout when not completed yet', () => {
    const workout = makeWorkout({ startedAtMs: 1000 })
    const result = finishWorkout(workout, 4000)

    expect(result.completedAtMs).toBe(4000)
    expect(result.completed).toBe(true)
    expect(result.startedAtMs).toBe(1000)
  })

  it('does not re-finish a workout that is already completed', () => {
    const workout = makeWorkout({ completedAtMs: 3000 })
    const result = finishWorkout(workout, 4000)

    expect(result).toBe(workout)
  })

  it('returns null elapsed time before a workout is started', () => {
    const workout = makeWorkout()
    const elapsed = calculateWorkoutElapsedSeconds(workout)

    expect(elapsed).toBeNull()
  })

  it('returns elapsed time for a completed workout', () => {
    const workout = makeWorkout({
      startedAtMs: 1000,
      completedAtMs: 5000,
    })
    const elapsed = calculateWorkoutElapsedSeconds(workout)

    expect(elapsed).toBe(4)
  })

  it('returns null for incomplete workout', () => {
    const workout = makeWorkout({ startedAtMs: 1000 })
    const elapsed = calculateWorkoutElapsedSeconds(workout)

    expect(elapsed).toBeNull()
  })

  it('returns null when completedAtMs is before startedAtMs', () => {
    const workout = makeWorkout({
      startedAtMs: 5000,
      completedAtMs: 1000,
    })
    const elapsed = calculateWorkoutElapsedSeconds(workout)

    expect(elapsed).toBeNull()
  })

  it('returns stable elapsed time across reloads', () => {
    const workout = makeWorkout({
      startedAtMs: 1000,
      completedAtMs: 9000,
    })
    const elapsed = calculateWorkoutElapsedSeconds(workout)

    expect(elapsed).toBe(8)
  })
})
