import type { Set } from '../models/Set'
import type { StopwatchState } from '../models/StopwatchState'
import { startStopwatch } from './stopwatchLogic'

/**
 * Handles stopwatch state transitions when a set is updated.
 *
 * Rules:
 * - Start or restart stopwatch when an enabled set transitions to 'completed'
 * - Do nothing if set was already completed
 * - Do nothing if set is disabled
 * - Do nothing if stopwatch is dismissed
 */
export function handleSetCompletionForStopwatch(
  previousSet: Set,
  nextSet: Set,
  currentStopwatch: StopwatchState | null,
  nowMs: number
): StopwatchState | null {
  // Set must be enabled
  if (!nextSet.enabled) {
    return currentStopwatch
  }

  // Only react to a transition into 'completed'
  if (nextSet.status !== 'completed') {
    return currentStopwatch
  }

  if (previousSet.status === 'completed') {
    return currentStopwatch
  }

  // Respect dismissed stopwatch
  if (currentStopwatch?.dismissed) {
    return currentStopwatch
  }

  // Start or restart stopwatch
  return startStopwatch(
    nowMs,
    currentStopwatch?.alertThresholdsSec
  )
}
