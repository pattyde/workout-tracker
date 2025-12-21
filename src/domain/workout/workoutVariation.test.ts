import { describe, it, expect } from 'vitest'
import { getNextWorkoutVariation } from './workoutVariation'
import type { Workout } from '../models/Workout'

function makeWorkout(
  overrides: Partial<Workout>
): Workout {
  return {
    id: 'w',
    dateMs: 0,
    exerciseInstances: [],
    variation: 'A',
    completed: false,
    ...overrides,
  }
}

describe('getNextWorkoutVariation', () => {
  it('returns A when there are no workouts', () => {
    const result = getNextWorkoutVariation([])
    expect(result).toBe('A')
  })

  it('returns B when last completed workout was A', () => {
    const workouts = [
      makeWorkout({
        id: 'w1',
        variation: 'A',
        completed: true,
        completedAtMs: 1000,
      }),
    ]

    const result = getNextWorkoutVariation(workouts)
    expect(result).toBe('B')
  })

  it('returns A when last completed workout was B', () => {
    const workouts = [
      makeWorkout({
        id: 'w1',
        variation: 'B',
        completed: true,
        completedAtMs: 1000,
      }),
    ]

    const result = getNextWorkoutVariation(workouts)
    expect(result).toBe('A')
  })

  it('ignores incomplete workouts', () => {
    const workouts = [
      makeWorkout({
        id: 'w1',
        variation: 'A',
        completed: false,
        completedAtMs: undefined,
      }),
      makeWorkout({
        id: 'w2',
        variation: 'B',
        completed: true,
        completedAtMs: 2000,
      }),
    ]

    const result = getNextWorkoutVariation(workouts)
    expect(result).toBe('A')
  })

  it('handles unordered input', () => {
    const workouts = [
      makeWorkout({
        id: 'w1',
        variation: 'A',
        completed: true,
        completedAtMs: 3000,
      }),
      makeWorkout({
        id: 'w2',
        variation: 'B',
        completed: true,
        completedAtMs: 1000,
      }),
    ]

    const result = getNextWorkoutVariation(workouts)
    expect(result).toBe('B')
  })

  it('handles deletion of the most recent workout', () => {
    const workouts = [
      makeWorkout({
        id: 'w1',
        variation: 'B',
        completed: true,
        completedAtMs: 1000,
      }),
    ]

    const result = getNextWorkoutVariation(workouts)
    expect(result).toBe('A')
  })

  it('reflects manual override on last completed workout', () => {
    const workouts = [
      makeWorkout({
        id: 'w1',
        variation: 'A',
        completed: true,
        completedAtMs: 1000,
      }),
      makeWorkout({
        id: 'w2',
        variation: 'B',
        completed: true,
        completedAtMs: 2000,
      }),
    ]

    const result = getNextWorkoutVariation(workouts)
    expect(result).toBe('A')
  })
})
