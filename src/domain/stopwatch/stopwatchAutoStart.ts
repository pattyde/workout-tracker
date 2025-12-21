import type { Set } from '../models/Set'

export function shouldAutoStartStopwatch(
  previousSet: Set,
  nextSet: Set
): boolean {
  if (nextSet.status === 'pending') {
    return false
  }

  if (previousSet.status !== 'pending') {
    return false
  }

  return (
    nextSet.status === 'completed' ||
    nextSet.status === 'failed'
  )
}
