import { describe, it, expect } from 'vitest'
import {
  applyRestTimingOnSetUpdate,
  applyRestTimingOnWorkoutCompletion,
} from './stopwatchRestTimingService'
import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import type { StopwatchState } from '../domain/models/StopwatchState'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import { startStopwatch } from '../domain/stopwatch/stopwatchLogic'

class MemoryWorkoutRepository implements WorkoutRepository {
  public saved: Workout[] = []

  async getById(): Promise<Workout | null> {
    return null
  }

  async listAll(): Promise<Workout[]> {
    return []
  }

  async save(workout: Workout): Promise<void> {
    this.saved.push(workout)
  }

  async deleteById(): Promise<void> {}
}

function makeSet(
  id: string,
  status: Set['status'],
  enabled = true,
  orderIndex = 0
): Set {
  return {
    id,
    orderIndex,
    type: 'work',
    enabled,
    targetWeight: 100,
    targetReps: 5,
    status,
  }
}

function makeWorkout(sets: Set[]): Workout {
  return {
    id: 'workout-1',
    dateMs: 0,
    exerciseInstances: [
      {
        id: 'ex-1',
        exerciseDefinitionId: 'def-1',
        workoutId: 'workout-1',
        orderIndex: 0,
        sets,
        barTypeId: 'bar-1',
        useSharedBarLoading: false,
      },
    ],
    variation: 'A',
    completed: false,
  }
}

describe('applyRestTimingOnSetUpdate', () => {
  it('records rest time between two completed sets', async () => {
    const set1 = makeSet('s1', 'completed', true, 0)
    const set2Prev = makeSet('s2', 'pending', true, 1)
    const set2Next = { ...set2Prev, status: 'completed' }
    const workout = makeWorkout([set1, set2Prev])
    const repo = new MemoryWorkoutRepository()
    const stopwatch = startStopwatch(1000, [90])

    const result = await applyRestTimingOnSetUpdate(
      workout,
      set2Next,
      stopwatch,
      4000,
      repo
    )

    const updatedSet1 =
      result.workout.exerciseInstances[0]?.sets[0]
    if (!updatedSet1) {
      throw new Error('Expected set1 to exist')
    }

    expect(updatedSet1.restElapsedSeconds).toBe(3)
    expect(result.stopwatch?.startTime).toBe(4000)
    expect(repo.saved).toHaveLength(1)
  })

  it('does not record rest when stopwatch is dismissed', async () => {
    const set1 = makeSet('s1', 'completed', true, 0)
    const set2Prev = makeSet('s2', 'pending', true, 1)
    const set2Next = { ...set2Prev, status: 'completed' }
    const workout = makeWorkout([set1, set2Prev])
    const repo = new MemoryWorkoutRepository()

    const dismissed: StopwatchState = {
      startTime: null,
      accumulatedMs: 0,
      alertThresholdsSec: [],
      firedThresholdsSec: [],
      dismissed: true,
    }

    const result = await applyRestTimingOnSetUpdate(
      workout,
      set2Next,
      dismissed,
      4000,
      repo
    )

    const updatedSet1 =
      result.workout.exerciseInstances[0]?.sets[0]
    if (!updatedSet1) {
      throw new Error('Expected set1 to exist')
    }

    expect(updatedSet1.restElapsedSeconds).toBeUndefined()
  })

  it('does not record rest for disabled sets', async () => {
    const set1 = makeSet('s1', 'completed', true, 0)
    const set2Prev = makeSet('s2', 'pending', false, 1)
    const set2Next = { ...set2Prev, status: 'completed' }
    const workout = makeWorkout([set1, set2Prev])
    const repo = new MemoryWorkoutRepository()
    const stopwatch = startStopwatch(1000, [90])

    const result = await applyRestTimingOnSetUpdate(
      workout,
      set2Next,
      stopwatch,
      4000,
      repo
    )

    const updatedSet1 =
      result.workout.exerciseInstances[0]?.sets[0]
    if (!updatedSet1) {
      throw new Error('Expected set1 to exist')
    }

    expect(updatedSet1.restElapsedSeconds).toBeUndefined()
  })
})

describe('applyRestTimingOnWorkoutCompletion', () => {
  it('records rest time when workout ends', async () => {
    const set1 = makeSet('s1', 'completed', true, 0)
    const workout = makeWorkout([set1])
    const completedWorkout = { ...workout, completed: true }
    const repo = new MemoryWorkoutRepository()
    const stopwatch = startStopwatch(1000, [90])

    const result = await applyRestTimingOnWorkoutCompletion(
      workout,
      completedWorkout,
      stopwatch,
      4000,
      repo
    )

    const updatedSet1 =
      result.workout.exerciseInstances[0]?.sets[0]
    if (!updatedSet1) {
      throw new Error('Expected set1 to exist')
    }

    expect(updatedSet1.restElapsedSeconds).toBe(3)
    expect(repo.saved).toHaveLength(1)
  })
})
