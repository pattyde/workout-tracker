import { describe, it, expect } from 'vitest'
import { getExerciseWorkWeight } from './workWeight'
import type { ExerciseInstance } from '../models/ExerciseInstance'

function makeExercise(
  targetWeight?: number
): ExerciseInstance {
  return {
    id: 'ex-1',
    exerciseDefinitionId: 'squat',
    workoutId: 'w-1',
    orderIndex: 0,
    sets: targetWeight == null ? [] : [
      {
        id: 'set-1',
        orderIndex: 0,
        type: 'work',
        enabled: true,
        targetWeight,
        targetReps: 5,
        status: 'pending',
      },
    ],
    barTypeId: 'olympic-20kg',
    useSharedBarLoading: false,
  }
}

describe('getExerciseWorkWeight', () => {
  it('returns null when no work set exists', () => {
    const exercise = makeExercise()
    expect(getExerciseWorkWeight(exercise)).toBeNull()
  })

  it('returns the first work set target weight', () => {
    const exercise = makeExercise(100)
    expect(getExerciseWorkWeight(exercise)).toBe(100)
  })
})
