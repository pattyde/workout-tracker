import type { ProgressionState } from '../domain/models/ProgressionState'

const DELOAD_THRESHOLD_MS = 28 * 24 * 60 * 60 * 1000 // 28 days

export function isDeloadRecommended(
  lastWorkoutCompletedAtMs: number | undefined,
  nowMs: number
): boolean {
  if (lastWorkoutCompletedAtMs === undefined) return false
  return nowMs - lastWorkoutCompletedAtMs > DELOAD_THRESHOLD_MS
}

export function applyDeload(
  progressionStates: Record<string, ProgressionState>,
  percentage: 10 | 25 | 50
): Record<string, ProgressionState> {
  const factor = 1 - percentage / 100
  const result: Record<string, ProgressionState> = {}

  for (const [id, state] of Object.entries(progressionStates)) {
    const newWeight =
      Math.floor((state.currentWeight * factor) / state.plateIncrement) *
      state.plateIncrement

    result[id] = { ...state, currentWeight: newWeight }
  }

  return result
}
