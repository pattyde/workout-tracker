import type { StopwatchState } from '../models/StopwatchState'

/**
 * Returns elapsed milliseconds for the stopwatch at a given time.
 */
export function getElapsedMs(
  state: StopwatchState,
  nowMs: number
): number {
  if (state.startTime == null) {
    return state.accumulatedMs
  }

  return state.accumulatedMs + (nowMs - state.startTime)
}
export function startStopwatch(
    nowMs: number,
    thresholdsSec: number[] = [90, 180, 300]
  ): StopwatchState {
    return {
      startTime: nowMs,
      accumulatedMs: 0,
      alertThresholdsSec: thresholdsSec,
      firedThresholdsSec: [],
      dismissed: false,
    }
  }
  
  export function pauseStopwatch(
    state: StopwatchState,
    nowMs: number
  ): StopwatchState {
    if (state.startTime == null) return state
  
    return {
      ...state,
      accumulatedMs: getElapsedMs(state, nowMs),
      startTime: null,
    }
  }
  
  export function resumeStopwatch(
    state: StopwatchState,
    nowMs: number
  ): StopwatchState {
    if (state.startTime != null || state.dismissed) return state
  
    return {
      ...state,
      startTime: nowMs,
    }
  }
  
  export function dismissStopwatch(
    state: StopwatchState
  ): StopwatchState {
    return {
      ...state,
      dismissed: true,
      startTime: null,
    }
  }
/**
 * Returns newly triggered alert thresholds (in seconds) since last evaluation.
 */
export function getNewlyTriggeredAlerts(
    state: StopwatchState,
    nowMs: number
  ): number[] {
    if (state.dismissed) return []
  
    const elapsedSec = Math.floor(getElapsedMs(state, nowMs) / 1000)
  
    return state.alertThresholdsSec.filter(
      threshold =>
        elapsedSec >= threshold &&
        !state.firedThresholdsSec.includes(threshold)
    )
  }
  export function markAlertsAsFired(
    state: StopwatchState,
    fired: number[]
  ): StopwatchState {
    if (fired.length === 0) return state
  
    return {
      ...state,
      firedThresholdsSec: [
        ...state.firedThresholdsSec,
        ...fired,
      ],
    }
  }
     