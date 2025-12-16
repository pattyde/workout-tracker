import { describe, it, expect } from 'vitest'
import type { Set } from '../models/Set'
import type { ProgressionState } from '../models/ProgressionState'
import { isWorkoutSuccessful, calculateNextProgression } from './progressionLogic'

describe('Progression Logic', () => {
  const barWeight = 20 // typical barbell weight (kg)

  const createWorkSets = (
    statuses: ('pending' | 'completed' | 'failed')[],
    actualReps?: number[]
  ): Set[] =>
    statuses.map((status, i) => ({
      id: `set-${i}`,
      type: 'work',
      targetWeight: 100,
      targetReps: 5,
      status,
      actualWeight: 100,
      actualReps: actualReps
        ? actualReps[i]
        : status === 'completed'
        ? 5
        : 0,
    } as Set))

  // -----------------------------
  // isWorkoutSuccessful
  // -----------------------------

  it('recognizes a successful workout when all work sets are completed', () => {
    const sets = createWorkSets([
      'completed',
      'completed',
      'completed',
      'completed',
      'completed',
    ])

    expect(isWorkoutSuccessful(sets)).toBe(true)
  })

  it('treats any failed work set as workout failure', () => {
    const sets = createWorkSets([
      'completed',
      'completed',
      'failed',
      'completed',
      'completed',
    ])

    expect(isWorkoutSuccessful(sets)).toBe(false)
  })

  it('treats pending work sets as workout failure', () => {
    const sets = createWorkSets([
      'completed',
      'completed',
      'pending',
      'completed',
      'completed',
    ])

    expect(isWorkoutSuccessful(sets)).toBe(false)
  })

  it('fails workout when there are no work sets', () => {
    const sets: Set[] = [
      {
        id: 'warmup-1',
        type: 'warmup',
        targetWeight: 60,
        targetReps: 5,
        status: 'completed',
        actualReps: 5,
      } as Set,
    ]

    expect(isWorkoutSuccessful(sets)).toBe(false)
  })

  // -----------------------------
  // calculateNextProgression
  // -----------------------------

  it('increments failure streak on workout failure without changing weight', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 100,
      failureStreak: 1,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }

    const sets = createWorkSets([
      'completed',
      'failed',
      'completed',
      'completed',
      'completed',
    ])

    const result = calculateNextProgression(progression, sets, barWeight)

    expect(result.success).toBe(false)
    expect(result.deloaded).toBe(false)
    expect(result.nextFailureStreak).toBe(2)
    expect(result.nextWeight).toBe(100)
  })

  it('resets failure streak and increases weight on successful workout', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 100,
      failureStreak: 2,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }

    const sets = createWorkSets([
      'completed',
      'completed',
      'completed',
      'completed',
      'completed',
    ])

    const result = calculateNextProgression(progression, sets, barWeight)

    expect(result.success).toBe(true)
    expect(result.deloaded).toBe(false)
    expect(result.nextFailureStreak).toBe(0)
    expect(result.nextWeight).toBe(102.5)
  })

  it('triggers deload after 3 consecutive failures', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 100,
      failureStreak: 2,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }

    const sets = createWorkSets([
      'failed',
      'failed',
      'failed',
      'failed',
      'failed',
    ])

    const result = calculateNextProgression(progression, sets, barWeight)

    expect(result.success).toBe(false)
    expect(result.deloaded).toBe(true)
    expect(result.nextFailureStreak).toBe(0)
    expect(result.nextWeight).toBe(90) // 100 * 0.9 → 90
  })

  it('rounds deload weight down to nearest plate increment', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 97.5,
      failureStreak: 2,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }

    const sets = createWorkSets([
      'failed',
      'failed',
      'failed',
      'failed',
      'failed',
    ])

    const result = calculateNextProgression(progression, sets, barWeight)

    // 97.5 * 0.9 = 87.75 → floored to 87.5
    expect(result.nextWeight).toBe(87.5)
    expect(result.deloaded).toBe(true)
  })

  it('does not deload below bar weight', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 22.5,
      failureStreak: 2,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }

    const sets = createWorkSets([
      'failed',
      'failed',
      'failed',
      'failed',
      'failed',
    ])

    const result = calculateNextProgression(progression, sets, barWeight)

    expect(result.nextWeight).toBe(barWeight)
    expect(result.deloaded).toBe(true)
  })

  it('recovers correctly after a deload when the next workout succeeds', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 90,
      failureStreak: 0,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }

    const sets = createWorkSets([
      'completed',
      'completed',
      'completed',
      'completed',
      'completed',
    ])

    const result = calculateNextProgression(progression, sets, barWeight)

    expect(result.success).toBe(true)
    expect(result.deloaded).toBe(false)
    expect(result.nextFailureStreak).toBe(0)
    expect(result.nextWeight).toBe(92.5)
  })
})
