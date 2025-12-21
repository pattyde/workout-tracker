import { useEffect, useState } from 'react'
import type { StopwatchState } from '../../domain/models/StopwatchState'
import { getElapsedMs } from '../../domain/stopwatch/stopwatchLogic'

export function useStopwatchElapsed(
  stopwatch: StopwatchState | null
): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    let interval: number | null = null

    if (stopwatch && stopwatch.startTime != null) {
      const tick = () => {
        const nowMs = Date.now()
        const elapsedMs = getElapsedMs(stopwatch, nowMs)
        setElapsedSeconds(Math.floor(elapsedMs / 1000))
      }

      tick()
      interval = window.setInterval(tick, 1000)
    } else {
      setElapsedSeconds(0)
    }

    return () => {
      if (interval != null) {
        window.clearInterval(interval)
      }
    }
  }, [stopwatch])

  return elapsedSeconds
}
