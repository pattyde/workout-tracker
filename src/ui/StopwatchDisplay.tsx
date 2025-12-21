import type { StopwatchState } from '../domain/models/StopwatchState'
import { useStopwatchElapsed } from './hooks/useStopwatchElapsed'

interface StopwatchDisplayProps {
  stopwatch: StopwatchState
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
}: StopwatchDisplayProps) {
  const elapsedSeconds = useStopwatchElapsed(stopwatch)

  return <div>Rest timer: {formatElapsed(elapsedSeconds)}</div>
}

export { formatElapsed }
