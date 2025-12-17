import { describe, it, expect } from 'vitest'
import { mapStopwatchAlertsToNotifications } from './stopwatchNotifications'
import { startStopwatch, markAlertsAsFired } from './stopwatchLogic'
import type { NotificationEvent } from '../models/NotificationEvents'

/**
 * Helper to assert exactly one event and return it
 * (narrows type so TS knows it is not undefined)
 */
function expectSingleEvent(
    events: NotificationEvent[]
  ): NotificationEvent {
    expect(events).toHaveLength(1)
  
    const event = events[0]
    if (!event) {
      throw new Error('Expected exactly one NotificationEvent')
    }
  
    return event
  }
  

describe('Stopwatch Notification Mapping', () => {
  it('maps triggered alerts to notification events', () => {
    const state = startStopwatch(0, [90])
    const events = mapStopwatchAlertsToNotifications(state, 90000)

    const event = expectSingleEvent(events)

    expect(event.type).toBe('rest-alert')
    expect(event.thresholdSec).toBe(90)
    expect(event.message).toBe('1m 30s rest completed')
  })

  it('does not emit notifications for already fired alerts', () => {
    let state = startStopwatch(0, [5])

    const firstEvents = mapStopwatchAlertsToNotifications(state, 6000)
    expectSingleEvent(firstEvents)

    state = markAlertsAsFired(state, [5])

    const secondEvents = mapStopwatchAlertsToNotifications(state, 10000)
    expect(secondEvents).toHaveLength(0)
  })

  it('formats multi-minute messages correctly', () => {
    const state = startStopwatch(0, [180])
    const events = mapStopwatchAlertsToNotifications(state, 180000)

    const event = expectSingleEvent(events)

    expect(event.message).toBe('3 minutes rest completed')
  })

  it('returns no events when no thresholds are crossed', () => {
    const state = startStopwatch(0, [90])
    const events = mapStopwatchAlertsToNotifications(state, 30000)

    expect(events).toHaveLength(0)
  })

  it('handles multiple alerts firing at once', () => {
    const state = startStopwatch(0, [60, 120])
    const events = mapStopwatchAlertsToNotifications(state, 130000)

    expect(events).toHaveLength(2)

    const thresholds = events
      .map(e => e.thresholdSec)
      .sort((a, b) => a - b)

    expect(thresholds).toEqual([60, 120])

    expect(thresholds).toEqual([60, 120])
  })
})
