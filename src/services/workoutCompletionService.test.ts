import { describe, it, expect } from 'vitest'
import { completeActiveWorkout } from './workoutCompletionService'
import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import type { AppState } from '../domain/models/AppState'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { AppStateRepository } from '../data/AppStateRepository'

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

class MemoryProgressionStateRepository
  implements ProgressionStateRepository
{
  public store = new Map<string, ProgressionState>()

  async getByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<ProgressionState | null> {
    return this.store.get(exerciseDefinitionId) ?? null
  }

  async listAll(): Promise<ProgressionState[]> {
    return Array.from(this.store.values())
  }

  async save(state: ProgressionState): Promise<void> {
    this.store.set(state.exerciseDefinitionId, state)
  }

  async deleteByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<void> {
    this.store.delete(exerciseDefinitionId)
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

function makeWorkSet(
  overrides: Partial<Set> = {}
): Set {
  return {
    id: 'set-1',
    orderIndex: 0,
    type: 'work',
    enabled: true,
    targetWeight: 100,
    targetReps: 5,
    status: 'pending',
    ...overrides,
  }
}

describe('completeActiveWorkout', () => {
  it('updates progression on success', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout: Workout = {
      id: 'w-1',
      dateMs: 0,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'squat',
          workoutId: 'w-1',
          orderIndex: 0,
          sets: [
            makeWorkSet({
              status: 'completed',
              actualReps: 5,
            }),
          ],
          workWeight: 100,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
      variation: 'A',
      startedAtMs: 0,
      completed: false,
    }

    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p1',
      exerciseDefinitionId: 'squat',
      currentWeight: 100,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-1',
      lastCompletedVariation: undefined,
    })

    const completed = await completeActiveWorkout({
      nowMs: 1000,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'squat'
      )

    expect(completed.completed).toBe(true)
    expect(completed.completedAtMs).toBe(1000)
    expect(progression?.currentWeight).toBe(102.5)
    expect(progression?.failureStreak).toBe(0)
    expect(appStateRepo.state?.activeWorkoutId).toBeUndefined()
    expect(appStateRepo.state?.lastCompletedVariation).toBe(
      'A'
    )
  })

  it('updates progression on failure', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout: Workout = {
      id: 'w-2',
      dateMs: 0,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'bench-press',
          workoutId: 'w-2',
          orderIndex: 0,
          sets: [makeWorkSet({ status: 'failed', actualReps: 0 })],
          workWeight: 80,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
      variation: 'B',
      startedAtMs: 0,
      completed: false,
    }

    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p2',
      exerciseDefinitionId: 'bench-press',
      currentWeight: 80,
      failureStreak: 1,
      plateIncrement: 2.5,
      unit: 'kg',
    })
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-2',
      lastCompletedVariation: undefined,
    })

    await completeActiveWorkout({
      nowMs: 2000,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'bench-press'
      )

    expect(progression?.currentWeight).toBe(80)
    expect(progression?.failureStreak).toBe(2)
  })

  it('deloads after 3 failures', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout: Workout = {
      id: 'w-3',
      dateMs: 0,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'deadlift',
          workoutId: 'w-3',
          orderIndex: 0,
          sets: [makeWorkSet({ status: 'failed', actualReps: 0 })],
          workWeight: 100,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
      variation: 'A',
      startedAtMs: 0,
      completed: false,
    }

    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p3',
      exerciseDefinitionId: 'deadlift',
      currentWeight: 100,
      failureStreak: 2,
      plateIncrement: 2.5,
      unit: 'kg',
    })
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-3',
      lastCompletedVariation: undefined,
    })

    await completeActiveWorkout({
      nowMs: 3000,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'deadlift'
      )

    expect(progression?.currentWeight).toBe(90)
    expect(progression?.failureStreak).toBe(0)
  })

  it('handles mixed success and failure across exercises', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout: Workout = {
      id: 'w-4',
      dateMs: 0,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'squat',
          workoutId: 'w-4',
          orderIndex: 0,
          sets: [
            makeWorkSet({
              status: 'completed',
              actualReps: 5,
            }),
          ],
          workWeight: 100,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
        {
          id: 'ex-2',
          exerciseDefinitionId: 'bench-press',
          workoutId: 'w-4',
          orderIndex: 1,
          sets: [
            makeWorkSet({
              status: 'failed',
              actualReps: 0,
            }),
          ],
          workWeight: 80,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
      variation: 'B',
      startedAtMs: 0,
      completed: false,
    }

    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p4',
      exerciseDefinitionId: 'squat',
      currentWeight: 100,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })
    await progressionRepo.save({
      id: 'p5',
      exerciseDefinitionId: 'bench-press',
      currentWeight: 80,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-4',
      lastCompletedVariation: undefined,
    })

    await completeActiveWorkout({
      nowMs: 4000,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const squat =
      await progressionRepo.getByExerciseDefinitionId(
        'squat'
      )
    const bench =
      await progressionRepo.getByExerciseDefinitionId(
        'bench-press'
      )

    expect(squat?.currentWeight).toBe(102.5)
    expect(squat?.failureStreak).toBe(0)
    expect(bench?.currentWeight).toBe(80)
    expect(bench?.failureStreak).toBe(1)
  })

  it('uses final work weight for progression', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout: Workout = {
      id: 'w-5',
      dateMs: 0,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'squat',
          workoutId: 'w-5',
          orderIndex: 0,
          sets: [
            makeWorkSet({
              status: 'completed',
              actualReps: 5,
            }),
          ],
          workWeight: 80,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
      variation: 'A',
      startedAtMs: 0,
      completed: false,
    }

    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p6',
      exerciseDefinitionId: 'squat',
      currentWeight: 100,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-5',
      lastCompletedVariation: undefined,
    })

    await completeActiveWorkout({
      nowMs: 5000,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'squat'
      )

    expect(progression?.currentWeight).toBe(82.5)
  })

  it('uses updated increment for progression', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout: Workout = {
      id: 'w-6',
      dateMs: 0,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'squat',
          workoutId: 'w-6',
          orderIndex: 0,
          sets: [
            makeWorkSet({
              status: 'completed',
              actualReps: 5,
            }),
          ],
          workWeight: 60,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
      variation: 'A',
      startedAtMs: 0,
      completed: false,
    }

    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p7',
      exerciseDefinitionId: 'squat',
      currentWeight: 60,
      failureStreak: 0,
      plateIncrement: 5,
      unit: 'kg',
    })
    await appStateRepo.save({
      id: 'app',
      activeStopwatch: null,
      unitPreference: 'kg',
      theme: 'system',
      activeWorkoutId: 'w-6',
      lastCompletedVariation: undefined,
    })

    await completeActiveWorkout({
      nowMs: 6000,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'squat'
      )

    expect(progression?.currentWeight).toBe(65)
  })
})
