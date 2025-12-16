import { describe, it, expect } from 'vitest'
import type { Set } from '../models/Set'
import type { ProgressionState } from '../models/ProgressionState'
import { isWorkoutSuccessful, calculateNextProgression } from './progressionLogic'

describe('Progression Logic', () => {
  const barWeight = 20 // typical barbell weight
  const createWorkSets = (statuses: ('pending' | 'completed' | 'failed')[], actualReps?: number[]): Set[] =>
    statuses.map((status, i) => ({
      id: `set-${i}`,
      type: 'work',
      targetWeight: 100,
      targetReps: 5,
      status,
      actualWeight: 100,
      actualReps: actualReps ? actualReps[i] : status === 'completed' ? 5 : 0,
    } as Set))

  it('recognizes a successful workout', () => {
    const sets = createWorkSets(['completed','completed','completed','completed','completed'])
    expect(isWorkoutSuccessful(sets)).toBe(true)
  })

  it('recognizes a failed workout', () => {
    const sets = createWorkSets(['completed','completed','failed','completed','completed'])
    expect(isWorkoutSuccessful(sets)).toBe(false)
  })

  it('increments failure streak on failure', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 100,
      failureStreak: 1,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }
    const sets = createWorkSets(['completed','failed','completed','completed','completed'])
    const result = calculateNextProgression(progression, sets, barWeight)
    expect(result.nextFailureStreak).toBe(2)
    expect(result.deloaded).toBe(false)
    expect(result.nextWeight).toBe(100) // weight unchanged
  })

  it('resets failure streak and increases weight on success', () => {
    const progression: ProgressionState = {
      id: 'prog1',
      exerciseDefinitionId: 'ex1',
      currentWeight: 100,
      failureStreak: 2,
      lastWorkoutDate: undefined,
      plateIncrement: 2.5,
      unit: 'kg',
    }
    const sets = createWorkSets(['completed','completed','completed','completed','completed'])
    const result = calculateNextProgression(progression, sets, barWeight)
    expect(result.nextFailureStreak).toBe(0)
    expect(result.nextWeight).toBe(102.5)
    expect(result.deloaded).toBe(false)
    expect(result.success).toBe(true)
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
    const sets = createWorkSets(['failed','failed','failed','failed','failed'])
    const result = calculateNextProgression(progression, sets, barWeight)
    expect(result.deloaded).toBe(true)
    expect(result.nextFailureStreak).toBe(0)
    expect(result.nextWeight).toBe(90) // 100 * 0.9 rounded down to nearest 2.5
    expect(result.success).toBe(false)
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
    const sets = createWorkSets(['failed','failed','failed','failed','failed'])
    const result = calculateNextProgression(progression, sets, barWeight)
    expect(result.nextWeight).toBe(barWeight) // cannot go below bar
  })
})
