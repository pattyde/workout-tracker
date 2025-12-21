import { describe, it, expect } from 'vitest'
import { startStopwatch } from './stopwatchLogic'
import {
  getStopwatchNotificationEvents,
} from './stopwatchNotifications'

describe('getStopwatchNotificationEvents', () => {
  it('returns no events before first threshold', () => {
    const state = startStopwatch(0, [90, 180])
    const result = getStopwatchNotificationEvents(
      state,
      60,
      60000
    )

    expect(result.events).toHaveLength(0)
    expect(result.updatedStopwatch).toBe(state)
  })

  it('fires a single threshold', () => {
    const state = startStopwatch(0, [90, 180])
    const result = getStopwatchNotificationEvents(
      state,
      90,
      90000
    )

    expect(result.events).toHaveLength(1)
    expect(result.updatedStopwatch.firedThresholdsSec).toEqual([
      90,
    ])
  })

  it('fires multiple thresholds at once', () => {
    const state = startStopwatch(0, [90, 180])
    const result = getStopwatchNotificationEvents(
      state,
      200,
      200000
    )

    const thresholds = result.events.map(e => e.thresholdSec)
    expect(thresholds).toEqual([90, 180])
  })

  it('fires thresholds only once', () => {
    const state = startStopwatch(0, [90])
    const first = getStopwatchNotificationEvents(
      state,
      90,
      90000
    )
    const second = getStopwatchNotificationEvents(
      first.updatedStopwatch,
      120,
      120000
    )

    expect(first.events).toHaveLength(1)
    expect(second.events).toHaveLength(0)
  })

  it('allows thresholds after restart', () => {
    const state = startStopwatch(0, [90])
    const first = getStopwatchNotificationEvents(
      state,
      90,
      90000
    )
    const restarted = startStopwatch(200000, [90])
    const second = getStopwatchNotificationEvents(
      restarted,
      90,
      290000
    )

    expect(first.events).toHaveLength(1)
    expect(second.events).toHaveLength(1)
  })

  it('does not fire events when dismissed', () => {
    const state = startStopwatch(0, [90])
    const dismissed = {
      ...state,
      startTime: null,
      dismissed: true,
    }
    const result = getStopwatchNotificationEvents(
      dismissed,
      90,
      90000
    )

    expect(result.events).toHaveLength(0)
    expect(result.updatedStopwatch).toBe(dismissed)
  })
})
