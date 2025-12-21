import { describe, it, expect } from 'vitest'
import { handleSetCompletionForStopwatch } from './stopwatchTriggers'
import { startStopwatch } from './stopwatchLogic'
import type { Set } from '../models/Set'
import type { StopwatchState } from '../models/StopwatchState'

function makeSet(
  status: Set['status'],
  enabled = true
): Set {
  return {
    id: 'set-1',
    orderIndex: 0,
    type: 'work',
    enabled,
    targetWeight: 100,
    targetReps: 5,
    status,
  }
}

describe('Stopwatch auto-start on set completion', () => {
  it('starts stopwatch when enabled set transitions to completed', () => {
    const prev = makeSet('pending')
    const next = makeSet('completed')

    const result = handleSetCompletionForStopwatch(
      prev,
      next,
      null,
      1000
    )

    expect(result).not.toBeNull()
    expect(result?.startTime).toBe(1000)
  })

  it('does not restart stopwatch if set was already completed', () => {
    const prev = makeSet('completed')
    const next = makeSet('completed')

    const existing = startStopwatch(0)

    const result = handleSetCompletionForStopwatch(
      prev,
      next,
      existing,
      2000
    )

    expect(result).toBe(existing)
  })

  it('restarts stopwatch when another enabled set completes', () => {
    const prev = makeSet('pending')
    const next = makeSet('completed')

    const existing = startStopwatch(0)

    const result = handleSetCompletionForStopwatch(
      prev,
      next,
      existing,
      5000
    )

    expect(result?.startTime).toBe(5000)
  })

  it('does not start stopwatch when set is disabled', () => {
    const prev = makeSet('pending', false)
    const next = makeSet('completed', false)

    const result = handleSetCompletionForStopwatch(
      prev,
      next,
      null,
      1000
    )

    expect(result).toBeNull()
  })

  it('does not start stopwatch when set does not complete', () => {
    const prev = makeSet('pending')
    const next = makeSet('failed')

    const result = handleSetCompletionForStopwatch(
      prev,
      next,
      null,
      1000
    )

    expect(result).toBeNull()
  })

  it('does not restart a dismissed stopwatch', () => {
    const prev = makeSet('pending')
    const next = makeSet('completed')

    const dismissed: StopwatchState = {
      startTime: null,
      accumulatedMs: 0,
      alertThresholdsSec: [90],
      firedThresholdsSec: [],
      dismissed: true,
    }

    const result = handleSetCompletionForStopwatch(
      prev,
      next,
      dismissed,
      3000
    )

    expect(result).toBe(dismissed)
  })
})
