import type { StopwatchState } from '../domain/models/StopwatchState'
import type { NotificationEvent } from '../domain/models/NotificationEvents'
import { useStopwatchElapsed } from './hooks/useStopwatchElapsed'

interface StopwatchDisplayProps {
  stopwatch: StopwatchState
  onEvents?: (events: NotificationEvent[]) => void
  onStopwatchUpdate?: (stopwatch: StopwatchState) => void
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const paddedSeconds = String(remainingSeconds).padStart(
    2,
    '0'
  )
  return `${minutes}:${paddedSeconds}`
}

export function StopwatchDisplay({
  stopwatch,
  onEvents,
  onStopwatchUpdate,
}: StopwatchDisplayProps) {
  const elapsedSeconds = useStopwatchElapsed(stopwatch, {
    onEvents,
    onStopwatchUpdate,
  })

  return <div>Rest timer: {formatElapsed(elapsedSeconds)}</div>
}

export { formatElapsed }
