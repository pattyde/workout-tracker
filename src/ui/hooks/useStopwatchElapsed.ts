import { useEffect, useState } from 'react'
import type { StopwatchState } from '../../domain/models/StopwatchState'
import type { NotificationEvent } from '../../domain/models/NotificationEvents'
import { getElapsedMs } from '../../domain/stopwatch/stopwatchLogic'
import { getStopwatchNotificationEvents } from '../../domain/stopwatch/stopwatchNotifications'

interface UseStopwatchElapsedOptions {
  onEvents?: (events: NotificationEvent[]) => void
  onStopwatchUpdate?: (stopwatch: StopwatchState) => void
}

export function useStopwatchElapsed(
  stopwatch: StopwatchState | null,
  options: UseStopwatchElapsedOptions = {}
): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const { onEvents, onStopwatchUpdate } = options

  useEffect(() => {
    let interval: number | null = null

    if (
      stopwatch &&
      stopwatch.startTime != null &&
      !stopwatch.dismissed
    ) {
      const tick = () => {
        const nowMs = Date.now()
        const elapsedMs = getElapsedMs(stopwatch, nowMs)
        const seconds = Math.floor(elapsedMs / 1000)
        setElapsedSeconds(seconds)

        const result = getStopwatchNotificationEvents(
          stopwatch,
          seconds,
          nowMs
        )

        if (result.events.length > 0) {
          onEvents?.(result.events)
          if (result.updatedStopwatch !== stopwatch) {
            onStopwatchUpdate?.(result.updatedStopwatch)
          }
        }
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
