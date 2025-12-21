import type { Set } from '../models/Set'

export function getNextSetState(
  set: Set
): Pick<Set, 'status' | 'actualReps'> {
  if (set.status === 'pending') {
    return {
      status: 'completed',
      actualReps: set.targetReps,
    }
  }

  const currentReps = set.actualReps ?? set.targetReps

  if (currentReps <= 0) {
    return {
      status: 'pending',
      actualReps: undefined,
    }
  }

  const nextReps = currentReps - 1

  return {
    status: 'failed',
    actualReps: nextReps,
  }
}
