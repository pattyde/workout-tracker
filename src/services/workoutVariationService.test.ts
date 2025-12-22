import { describe, it, expect } from 'vitest'
import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { AppState } from '../domain/models/AppState'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import { switchActiveWorkoutVariation } from './workoutVariationService'
import { STRONGLIFTS_5X5 } from '../domain/programs/stronglifts5x5'

class MemoryWorkoutRepository implements WorkoutRepository {
  public store = new Map<string, Workout>()

  async getById(id: string): Promise<Workout | null> {
    return this.store.get(id) ?? null
  }

  async listAll(): Promise<Workout[]> {
    return Array.from(this.store.values())
  }

  async save(workout: Workout): Promise<void> {
    this.store.set(workout.id, workout)
  }

  async deleteById(id: string): Promise<void> {
    this.store.delete(id)
  }
}

class MemoryAppStateRepository implements AppStateRepository {
  public state: AppState | null = null

  async get(): Promise<AppState | null> {
    return this.state
  }

  async save(state: AppState): Promise<void> {
    this.state = state
  }

  async clear(): Promise<void> {
    this.state = null
  }
}

const DEFINITIONS: Record<string, ExerciseDefinition> = {
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

const PROGRESSIONS: Record<string, ProgressionState> = {
  squat: {
    id: 'p-squat',
    exerciseDefinitionId: 'squat',
    currentWeight: 20,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
  },
  'bench-press': {
    id: 'p-bench',
    exerciseDefinitionId: 'bench-press',
    currentWeight: 20,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
  },
  'barbell-row': {
    id: 'p-row',
    exerciseDefinitionId: 'barbell-row',
    currentWeight: 20,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
  },
  'overhead-press': {
    id: 'p-ohp',
    exerciseDefinitionId: 'overhead-press',
    currentWeight: 20,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
  },
  deadlift: {
    id: 'p-deadlift',
    exerciseDefinitionId: 'deadlift',
    currentWeight: 40,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
  },
}

function makeActiveWorkout(): Workout {
  return {
    id: 'workout-1',
    dateMs: 0,
    exerciseInstances: STRONGLIFTS_5X5.variations.A.map(
      (exerciseDefinitionId, index) => ({
        id: `ex-${exerciseDefinitionId}`,
        exerciseDefinitionId,
        workoutId: 'workout-1',
        orderIndex: index,
        sets: [
          {
            id: `set-${exerciseDefinitionId}`,
            orderIndex: 0,
            type: 'work',
            enabled: true,
            targetWeight: 20,
            targetReps: 5,
            status: 'completed' as const,
            actualReps: 5,
          },
        ],
        workWeight: 20,
        barTypeId: 'olympic-20kg',
        useSharedBarLoading: false,
      })
    ),
    variation: 'A',
    startedAtMs: 0,
    completed: false,
  }
}

describe('switchActiveWorkoutVariation', () => {
  it('rebuilds exercise list and discards set data', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const workout = makeActiveWorkout()
    await workoutRepo.save(workout)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: workout.id,
    })

    const updated = await switchActiveWorkoutVariation({
      variation: 'B',
      exerciseDefinitions: DEFINITIONS,
      progressionStates: PROGRESSIONS,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    const expectedExercises = STRONGLIFTS_5X5.variations.B
    expect(updated.variation).toBe('B')
    expect(
      updated.exerciseInstances.map(
        exercise => exercise.exerciseDefinitionId
      )
    ).toEqual(expectedExercises)
    for (const exercise of updated.exerciseInstances) {
      for (const set of exercise.sets) {
        expect(set.status).toBe('pending')
        expect(set.actualReps).toBeUndefined()
      }
    }
  })

  it('resets rotation tracking in app state', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const workout = makeActiveWorkout()
    await workoutRepo.save(workout)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: workout.id,
      lastCompletedVariation: 'A',
    })

    await switchActiveWorkoutVariation({
      variation: 'B',
      exerciseDefinitions: DEFINITIONS,
      progressionStates: PROGRESSIONS,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    expect(appStateRepo.state?.lastCompletedVariation).toBe(
      'B'
    )
  })
})
