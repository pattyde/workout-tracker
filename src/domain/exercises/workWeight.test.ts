import { describe, it, expect } from 'vitest'
import { getExerciseWorkWeight } from './workWeight'
import type { ExerciseInstance } from '../models/ExerciseInstance'

function makeExercise(
  workWeight?: number
): ExerciseInstance {
  return {
    id: 'ex-1',
    exerciseDefinitionId: 'squat',
    workoutId: 'w-1',
    orderIndex: 0,
    sets: [],
    workWeight: workWeight ?? 0,
    barTypeId: 'olympic-20kg',
    useSharedBarLoading: false,
  }
}

describe('getExerciseWorkWeight', () => {
  it('returns null when work weight is not a number', () => {
    const exercise = makeExercise(Number.NaN)
    expect(getExerciseWorkWeight(exercise)).toBeNull()
  })

  it('returns the first work set target weight', () => {
    const exercise = makeExercise(100)
    expect(getExerciseWorkWeight(exercise)).toBe(100)
  })
})
