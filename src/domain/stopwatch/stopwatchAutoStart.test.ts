import { describe, it, expect } from 'vitest'
import { shouldAutoStartStopwatch } from './stopwatchAutoStart'
import type { Set } from '../models/Set'

function makeSet(
  status: Set['status']
): Set {
  return {
    id: 'set-1',
    orderIndex: 0,
    type: 'work',
    enabled: true,
    targetWeight: 100,
    targetReps: 5,
    status,
  }
}

describe('shouldAutoStartStopwatch', () => {
  it('returns true for pending to completed', () => {
    const prev = makeSet('pending')
    const next = makeSet('completed')

    expect(shouldAutoStartStopwatch(prev, next)).toBe(true)
  })

  it('returns true for pending to failed', () => {
    const prev = makeSet('pending')
    const next = makeSet('failed')

    expect(shouldAutoStartStopwatch(prev, next)).toBe(true)
  })

  it('returns false for completed to failed', () => {
    const prev = makeSet('completed')
    const next = makeSet('failed')

    expect(shouldAutoStartStopwatch(prev, next)).toBe(false)
  })

  it('returns false for failed to completed', () => {
    const prev = makeSet('failed')
    const next = makeSet('completed')

    expect(shouldAutoStartStopwatch(prev, next)).toBe(false)
  })

  it('returns false for any to pending', () => {
    const prev = makeSet('completed')
    const next = makeSet('pending')

    expect(shouldAutoStartStopwatch(prev, next)).toBe(false)
  })
})
