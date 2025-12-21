import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startOrResumeWorkout } from './startOrResumeWorkoutService'
import type { Workout } from '../domain/models/Workout'
import type { AppState } from '../domain/models/AppState'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'

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
    },
    'bench-press': {
      id: 'p-bench',
      exerciseDefinitionId: 'bench-press',
      currentWeight: 80,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    'barbell-row': {
      id: 'p-row',
      exerciseDefinitionId: 'barbell-row',
      currentWeight: 60,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    'overhead-press': {
      id: 'p-ohp',
      exerciseDefinitionId: 'overhead-press',
      currentWeight: 50,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    deadlift: {
      id: 'p-deadlift',
      exerciseDefinitionId: 'deadlift',
      currentWeight: 140,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
  }

function makeCompletedWorkout(
  id: string,
  variation: Workout['variation'],
  completedAtMs: number
): Workout {
  return {
    id,
    dateMs: 0,
    exerciseInstances: [],
    variation,
    startedAtMs: 0,
    completedAtMs,
    completed: true,
  }
}

describe('startOrResumeWorkout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('resumes existing active workout', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const existing: Workout = {
      id: 'w-1',
      dateMs: 0,
      exerciseInstances: [],
      variation: 'A',
      startedAtMs: 1000,
      completed: false,
    }
    await workoutRepo.save(existing)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-1',
      lastCompletedVariation: undefined,
    })

    const result = await startOrResumeWorkout({
      nowMs: 2000,
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    expect(result).toEqual(existing)
    expect(workoutRepo.store.size).toBe(1)
  })

  it('starts a new workout when none exists', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('w-2')
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: undefined,
      lastCompletedVariation: undefined,
    })

    const result = await startOrResumeWorkout({
      nowMs: 1000,
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    expect(result.id).toBe('w-2')
    expect(result.completed).toBe(false)
    expect(appStateRepo.state?.activeWorkoutId).toBe('w-2')
  })

  it('clears stale activeWorkoutId and starts new workout', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('w-3')
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'missing',
      lastCompletedVariation: undefined,
    })

    const result = await startOrResumeWorkout({
      nowMs: 1000,
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    expect(result.id).toBe('w-3')
    expect(appStateRepo.state?.activeWorkoutId).toBe('w-3')
  })

  it('selects next variation based on completed workouts', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('w-4')
    await workoutRepo.save(
      makeCompletedWorkout('w-10', 'A', 1000)
    )
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: undefined,
      lastCompletedVariation: undefined,
    })

    const result = await startOrResumeWorkout({
      nowMs: 2000,
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    expect(result.variation).toBe('B')
  })

  it('uses builder output for exercises and weights', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('w-5')

    const result = await startOrResumeWorkout({
      nowMs: 3000,
      exerciseDefinitions: EXERCISE_DEFINITIONS,
      progressionStates: PROGRESSION_STATES,
      workoutRepository: workoutRepo,
      appStateRepository: appStateRepo,
    })

    const ids = result.exerciseInstances.map(
      e => e.exerciseDefinitionId
    )
    expect(ids).toEqual([
      'squat',
      'bench-press',
      'barbell-row',
    ])

    const squat = result.exerciseInstances[0]
    if (!squat) throw new Error('Expected squat')
    expect(squat.sets).toHaveLength(5)
    expect(squat.sets[0]?.targetWeight).toBe(100)
    expect(squat.sets[0]?.status).toBe('pending')
  })
})
