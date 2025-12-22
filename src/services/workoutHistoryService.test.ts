import { describe, it, expect } from 'vitest'
import {
  updateCompletedWorkout,
  softDeleteWorkout,
} from './workoutHistoryService'
import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { AppState } from '../domain/models/AppState'
import type { AppStateRepository } from '../data/AppStateRepository'

class MemoryWorkoutRepository implements WorkoutRepository {
  public store = new Map<string, Workout>()

  async getById(id: string): Promise<Workout | null> {
    return this.store.get(id) ?? null
  }

  async listAll(): Promise<Workout[]> {
    return Array.from(this.store.values()).filter(
      workout => !workout.deleted
    )
  }

  async save(workout: Workout): Promise<void> {
    this.store.set(workout.id, workout)
  }

  async deleteById(): Promise<void> {}
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

  async deleteByExerciseDefinitionId(): Promise<void> {}
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

function makeWorkout(
  overrides: Partial<Workout> = {}
): Workout {
  return {
    id: 'w-1',
    dateMs: 0,
    exerciseInstances: [
      {
        id: 'ex-1',
        exerciseDefinitionId: 'squat',
        workoutId: 'w-1',
        orderIndex: 0,
        sets: [makeWorkSet()],
        workWeight: 100,
        barTypeId: 'olympic-20kg',
        useSharedBarLoading: false,
      },
    ],
    variation: 'A',
    startedAtMs: 0,
    completedAtMs: 1000,
    completed: true,
    ...overrides,
  }
}

describe('workout history service', () => {
  it('updates completed workouts with edited set results', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout = makeWorkout()
    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p1',
      exerciseDefinitionId: 'squat',
      currentWeight: 100,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })

    const firstExercise = workout.exerciseInstances[0]
    if (!firstExercise) {
      throw new Error('Expected exercise instance')
    }

    const updated = {
      ...workout,
      exerciseInstances: [
        {
          ...firstExercise,
          sets: [
            makeWorkSet({
              status: 'completed',
              actualReps: 5,
            }),
          ],
        },
      ],
    }

    const result = await updateCompletedWorkout({
      workoutId: workout.id,
      updatedWorkout: updated,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const updatedSet =
      result.exerciseInstances[0]?.sets[0]
    if (!updatedSet) {
      throw new Error('Expected updated set')
    }

    expect(updatedSet.status).toBe('completed')
    expect(updatedSet.actualReps).toBe(5)
  })

  it('marks a workout as deleted', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const workout = makeWorkout()
    await workoutRepo.save(workout)
    await progressionRepo.save({
      id: 'p1',
      exerciseDefinitionId: 'squat',
      currentWeight: 100,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })

    await softDeleteWorkout({
      workoutId: workout.id,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const stored = await workoutRepo.getById(workout.id)
    expect(stored?.deleted).toBe(true)
  })

  it('recalculates progression when deleting most recent workout', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const older = makeWorkout({
      id: 'w-old',
      completedAtMs: 1000,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'squat',
          workoutId: 'w-old',
          orderIndex: 0,
          sets: [
            makeWorkSet({
              status: 'failed',
              actualReps: 0,
            }),
          ],
          workWeight: 100,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
    })
    const recent = makeWorkout({
      id: 'w-new',
      completedAtMs: 2000,
    })

    await workoutRepo.save(older)
    await workoutRepo.save(recent)
    await progressionRepo.save({
      id: 'p1',
      exerciseDefinitionId: 'squat',
      currentWeight: 102.5,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })

    await softDeleteWorkout({
      workoutId: recent.id,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'squat'
      )
    expect(progression?.currentWeight).toBe(100)
    expect(progression?.failureStreak).toBe(1)
  })

  it('does not recalculate progression when deleting older workout', async () => {
    const workoutRepo = new MemoryWorkoutRepository()
    const progressionRepo =
      new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    const older = makeWorkout({
      id: 'w-old',
      completedAtMs: 1000,
    })
    const recent = makeWorkout({
      id: 'w-new',
      completedAtMs: 2000,
      exerciseInstances: [
        {
          id: 'ex-1',
          exerciseDefinitionId: 'squat',
          workoutId: 'w-new',
          orderIndex: 0,
          sets: [
            makeWorkSet({
              status: 'completed',
              actualReps: 5,
            }),
          ],
          workWeight: 105,
          barTypeId: 'olympic-20kg',
          useSharedBarLoading: false,
        },
      ],
    })

    await workoutRepo.save(older)
    await workoutRepo.save(recent)
    await progressionRepo.save({
      id: 'p1',
      exerciseDefinitionId: 'squat',
      currentWeight: 105,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })

    await softDeleteWorkout({
      workoutId: older.id,
      workoutRepository: workoutRepo,
      progressionStateRepository: progressionRepo,
      appStateRepository: appStateRepo,
    })

    const progression =
      await progressionRepo.getByExerciseDefinitionId(
        'squat'
      )
    expect(progression?.currentWeight).toBe(105)
    expect(progression?.failureStreak).toBe(0)
  })
})
