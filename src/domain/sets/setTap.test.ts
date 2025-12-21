import { describe, it, expect } from 'vitest'
import { getNextSetState } from './setTap'
import type { Set } from '../models/Set'

function makeSet(
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

describe('getNextSetState', () => {
  it('moves pending to completed with full reps', () => {
    const set = makeSet({ status: 'pending' })
    const next = getNextSetState(set)

    expect(next.status).toBe('completed')
    expect(next.actualReps).toBe(5)
  })

  it('moves completed to failed with reps decremented', () => {
    const set = makeSet({
      status: 'completed',
      actualReps: 5,
    })
    const next = getNextSetState(set)

    expect(next.status).toBe('failed')
    expect(next.actualReps).toBe(4)
  })

  it('decrements down to 0', () => {
    const set = makeSet({
      status: 'failed',
      actualReps: 1,
    })
    const next = getNextSetState(set)

    expect(next.status).toBe('failed')
    expect(next.actualReps).toBe(0)
  })

  it('resets from 0 to pending', () => {
    const set = makeSet({
      status: 'failed',
      actualReps: 0,
    })
    const next = getNextSetState(set)

    expect(next.status).toBe('pending')
    expect(next.actualReps).toBeUndefined()
  })
})
