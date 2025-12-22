import { describe, it, expect } from 'vitest'
import { buildWorkoutExercises } from './workoutBuilder'
import { STRONGLIFTS_5X5 } from '../programs/stronglifts5x5'
import type { ExerciseDefinition } from '../models/ExerciseDefinitions'
import type { ProgressionState } from '../models/ProgressionState'

const EXERCISE_DEFINITIONS: Record<
  string,
  ExerciseDefinition
> = {
  squat: {
    id: 'squat',
    name: 'Squat',
    defaultPlateIncrement: 2.5,
    defaultUnit: 'kg',
    createdAtMs: 0,
    archived: false,
  },
  'bench-press': {
    id: 'bench-press',
    name: 'Bench Press',
    defaultPlateIncrement: 2.5,
    defaultUnit: 'kg',
    createdAtMs: 0,
    archived: false,
  },
  'barbell-row': {
    id: 'barbell-row',
    name: 'Barbell Row',
    defaultPlateIncrement: 2.5,
    defaultUnit: 'kg',
    createdAtMs: 0,
    archived: false,
  },
  'overhead-press': {
    id: 'overhead-press',
    name: 'Overhead Press',
    defaultPlateIncrement: 2.5,
    defaultUnit: 'kg',
    createdAtMs: 0,
    archived: false,
  },
  deadlift: {
    id: 'deadlift',
    name: 'Deadlift',
    defaultPlateIncrement: 2.5,
    defaultUnit: 'kg',
    createdAtMs: 0,
    archived: false,
  },
}

const PROGRESSION_STATES: Record<string, ProgressionState> =
  {
  squat: {
    id: 'p-squat',
    exerciseDefinitionId: 'squat',
    currentWeight: 100,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
    preferredBarTypeId: 'olympic-20kg',
  },
  'bench-press': {
    id: 'p-bench',
    exerciseDefinitionId: 'bench-press',
    currentWeight: 80,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
    preferredBarTypeId: 'olympic-20kg',
  },
  'barbell-row': {
    id: 'p-row',
    exerciseDefinitionId: 'barbell-row',
    currentWeight: 60,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
    preferredBarTypeId: 'olympic-20kg',
  },
  'overhead-press': {
    id: 'p-ohp',
    exerciseDefinitionId: 'overhead-press',
    currentWeight: 50,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
    preferredBarTypeId: 'olympic-20kg',
  },
  deadlift: {
    id: 'p-deadlift',
    exerciseDefinitionId: 'deadlift',
    currentWeight: 140,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
    preferredBarTypeId: 'olympic-20kg',
  },
  }

describe('buildWorkoutExercises', () => {
  it('builds variation A with correct exercises and sets', () => {
    const exercises = buildWorkoutExercises({
      workoutId: 'w-1',
      variation: 'A',
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
    })

    const order = STRONGLIFTS_5X5.variations.A
    expect(exercises).toHaveLength(order.length)

    const ids = exercises.map(e => e.exerciseDefinitionId)
    expect(ids).toEqual(order)

    const squat = exercises[0]
    if (!squat) throw new Error('Expected squat')
    expect(squat.sets).toHaveLength(5)
    expect(squat.sets[0]?.targetReps).toBe(5)
    expect(squat.sets[0]?.targetWeight).toBe(100)
    expect(squat.workWeight).toBe(100)
    expect(squat.barTypeId).toBe('olympic-20kg')
  })

  it('uses preferred bar type when provided', () => {
    const squatProgression = PROGRESSION_STATES.squat
    if (!squatProgression) {
      throw new Error('Expected squat progression state')
    }

    const exercises = buildWorkoutExercises({
      workoutId: 'w-5',
      variation: 'A',
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: {
        ...PROGRESSION_STATES,
        squat: {
          ...squatProgression,
          preferredBarTypeId: 'training-15kg',
        },
      },
    })

    const squatExercise = exercises[0]
    if (!squatExercise) throw new Error('Expected squat')
    expect(squatExercise.barTypeId).toBe('training-15kg')
  })

  it('builds variation B with correct exercises and sets', () => {
    const exercises = buildWorkoutExercises({
      workoutId: 'w-2',
      variation: 'B',
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
    })

    const order = STRONGLIFTS_5X5.variations.B
    expect(exercises).toHaveLength(order.length)

    const ids = exercises.map(e => e.exerciseDefinitionId)
    expect(ids).toEqual(order)

    const deadlift = exercises[2]
    if (!deadlift) throw new Error('Expected deadlift')
    expect(deadlift.sets).toHaveLength(1)
    expect(deadlift.sets[0]?.targetReps).toBe(5)
    expect(deadlift.sets[0]?.targetWeight).toBe(140)
    expect(deadlift.workWeight).toBe(140)
    expect(deadlift.barTypeId).toBe('olympic-20kg')
  })

  it('sets correct reps, weights, and status for all sets', () => {
    const exercises = buildWorkoutExercises({
      workoutId: 'w-3',
      variation: 'A',
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
    })

    for (const exercise of exercises) {
      const progression =
        PROGRESSION_STATES[exercise.exerciseDefinitionId]
      if (!progression) {
        throw new Error('Expected progression state')
      }

      for (const set of exercise.sets) {
        expect(set.status).toBe('pending')
        expect(set.enabled).toBe(true)
        expect(set.targetWeight).toBe(
          progression.currentWeight
        )
      }
    }
  })

  it('assigns stable ordering and sequential set orderIndex', () => {
    const exercises = buildWorkoutExercises({
      workoutId: 'w-4',
      variation: 'B',
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
    })

    exercises.forEach((exercise, index) => {
      expect(exercise.orderIndex).toBe(index)
      exercise.sets.forEach((set, setIndex) => {
        expect(set.orderIndex).toBe(setIndex)
      })
    })
  })
})
