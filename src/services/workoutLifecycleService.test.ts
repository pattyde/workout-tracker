import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  startWorkout,
  getActiveWorkout,
  completeActiveWorkout,
  abandonActiveWorkout,
} from './workoutLifecycleService'
import type { Workout } from '../domain/models/Workout'
import type { AppState } from '../domain/models/AppState'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { ExerciseInstance } from '../domain/models/ExerciseInstance'

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
  public saves: AppState[] = []

  async get(): Promise<AppState | null> {
    return this.state
  }

  async save(state: AppState): Promise<void> {
    this.state = state
    this.saves.push(state)
  }

  async clear(): Promise<void> {
    this.state = null
  }
}

function makeExerciseInstances(): ExerciseInstance[] {
  return [
    {
      id: 'ex-1',
      exerciseDefinitionId: 'def-1',
      workoutId: 'w-placeholder',
      orderIndex: 0,
      sets: [],
      workWeight: 100,
      barTypeId: 'bar-1',
      useSharedBarLoading: false,
    },
  ]
}

describe('WorkoutLifecycleService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts the first workout and initializes app state', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('w-1')

    const workout = await startWorkout(
      makeExerciseInstances(),
      'A',
      1000,
      workoutRepo,
      appStateRepo
    )

    expect(workout.id).toBe('w-1')
    expect(workout.startedAtMs).toBe(1000)
    expect(workout.dateMs).toBe(1000)
    expect(workout.completed).toBe(false)
    expect(workout.completedAtMs).toBeUndefined()

    expect(appStateRepo.state?.activeWorkoutId).toBe('w-1')
  })

  it('resumes existing active workout', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const workout: Workout = {
      id: 'w-2',
      dateMs: 1000,
      exerciseInstances: [],
      variation: 'A',
      startedAtMs: 1000,
      completed: false,
    }
    await workoutRepo.save(workout)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-2',
      lastCompletedVariation: undefined,
    })

    const active = await getActiveWorkout(
      workoutRepo,
      appStateRepo
    )

    expect(active).toEqual(workout)
  })

  it('prevents multiple active workouts', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('w-3')

    const first = await startWorkout(
      makeExerciseInstances(),
      'A',
      1000,
      workoutRepo,
      appStateRepo
    )
    const second = await startWorkout(
      makeExerciseInstances(),
      'B',
      2000,
      workoutRepo,
      appStateRepo
    )

    expect(second).toEqual(first)
    expect(workoutRepo.store.size).toBe(1)
  })

  it('completes the active workout and updates app state', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const workout: Workout = {
      id: 'w-4',
      dateMs: 1000,
      exerciseInstances: [],
      variation: 'A',
      startedAtMs: 1000,
      completed: false,
    }
    await workoutRepo.save(workout)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-4',
      lastCompletedVariation: undefined,
    })

    const completed = await completeActiveWorkout(
      5000,
      workoutRepo,
      appStateRepo
    )

    expect(completed?.completed).toBe(true)
    expect(completed?.completedAtMs).toBe(5000)
    expect(appStateRepo.state?.activeWorkoutId).toBeUndefined()
    expect(appStateRepo.state?.lastWorkoutId).toBe('w-4')
  })

  it('abandons the active workout', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const workout: Workout = {
      id: 'w-5',
      dateMs: 1000,
      exerciseInstances: [],
      variation: 'A',
      startedAtMs: 1000,
      completed: false,
    }
    await workoutRepo.save(workout)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-5',
      lastCompletedVariation: undefined,
    })

    await abandonActiveWorkout(workoutRepo, appStateRepo)

    expect(workoutRepo.store.size).toBe(0)
    expect(appStateRepo.state?.activeWorkoutId).toBeUndefined()
    expect(appStateRepo.state?.lastWorkoutId).toBeUndefined()
  })

  it('clears stale activeWorkoutId on reload', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'missing',
      lastCompletedVariation: undefined,
    })

    const active = await getActiveWorkout(
      workoutRepo,
      appStateRepo
    )

    expect(active).toBeNull()
    expect(appStateRepo.state?.activeWorkoutId).toBeUndefined()
  })

  it('clears activeWorkoutId if active workout is already completed', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const appStateRepo = new MemoryAppStateRepository()
    const workout: Workout = {
      id: 'w-6',
      dateMs: 1000,
      exerciseInstances: [],
      variation: 'A',
      startedAtMs: 1000,
      completed: true,
      completedAtMs: 2000,
    }
    await workoutRepo.save(workout)
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-6',
      lastCompletedVariation: undefined,
    })

    const active = await getActiveWorkout(
      workoutRepo,
      appStateRepo
    )

    expect(active).toBeNull()
    expect(appStateRepo.state?.activeWorkoutId).toBeUndefined()
  })
})
