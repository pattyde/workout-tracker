import { describe, it, expect } from 'vitest'
import {
  startStopwatch,
  pauseStopwatch,
  resumeStopwatch,
  dismissStopwatch,
  getElapsedMs,
  getNewlyTriggeredAlerts,
  markAlertsAsFired,
} from './stopwatchLogic'

describe('Stopwatch Logic', () => {
  it('counts elapsed time correctly', () => {
    const state = startStopwatch(1000)
    expect(getElapsedMs(state, 4000)).toBe(3000)
  })

  it('pauses and resumes correctly', () => {
    let state = startStopwatch(0)
    state = pauseStopwatch(state, 5000)

    expect(getElapsedMs(state, 8000)).toBe(5000)

    state = resumeStopwatch(state, 10000)
    expect(getElapsedMs(state, 13000)).toBe(8000)
  })

  it('fires alerts when thresholds are crossed', () => {
    const state = startStopwatch(0, [5, 10])
    const alerts = getNewlyTriggeredAlerts(state, 6000)

    expect(alerts).toEqual([5])
  })

  it('does not repeat alerts once fired', () => {
    let state = startStopwatch(0, [5])
    const alerts = getNewlyTriggeredAlerts(state, 6000)
    state = markAlertsAsFired(state, alerts)

    const again = getNewlyTriggeredAlerts(state, 10000)
    expect(again).toEqual([])
  })

  it('dismissed stopwatch does not fire alerts', () => {
    let state = startStopwatch(0, [5])
    state = dismissStopwatch(state)

    const alerts = getNewlyTriggeredAlerts(state, 10000)
    expect(alerts).toEqual([])
  })
})
