import type { StopwatchState } from '../models/StopwatchState'
import type { NotificationEvent } from '../models/NotificationEvents'
import { getNewlyTriggeredAlerts } from './stopwatchLogic'

export function getStopwatchNotificationEvents(
  state: StopwatchState,
  elapsedSeconds: number,
  nowMs: number
): {
  events: NotificationEvent[]
  updatedStopwatch: StopwatchState
} {
  if (state.dismissed || state.startTime == null) {
    return { events: [], updatedStopwatch: state }
  }

  const triggered = state.alertThresholdsSec
    .filter(
      threshold =>
        elapsedSeconds >= threshold &&
        !state.firedThresholdsSec.includes(threshold)
    )
    .sort((a, b) => a - b)

  if (triggered.length === 0) {
    return { events: [], updatedStopwatch: state }
  }

  const events: NotificationEvent[] = triggered.map(
    thresholdSec => ({
      id: `rest-alert-${thresholdSec}-${nowMs}`,
      type: 'rest-alert',
      thresholdSec,
      timestampMs: nowMs,
      message: buildRestAlertMessage(thresholdSec),
    })
  )

  return {
    events,
    updatedStopwatch: {
      ...state,
      firedThresholdsSec: [
        ...state.firedThresholdsSec,
        ...triggered,
      ],
    },
  }
}

/**
 * Maps newly triggered stopwatch alerts to notification events.
 */
export function mapStopwatchAlertsToNotifications(
  state: StopwatchState,
  nowMs: number
): NotificationEvent[] {
  const triggered = getNewlyTriggeredAlerts(state, nowMs)

  return triggered.map(thresholdSec => ({
    id: `rest-alert-${thresholdSec}-${nowMs}`,
    type: 'rest-alert' as const,
    thresholdSec,
    timestampMs: nowMs,
    message: buildRestAlertMessage(thresholdSec),
  }))
}

function buildRestAlertMessage(thresholdSec: number): string {
  if (thresholdSec < 60) {
    return `${thresholdSec} seconds rest completed`
  }

  const minutes = Math.floor(thresholdSec / 60)
  const seconds = thresholdSec % 60

  if (seconds === 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} rest completed`
  }

  const minuteLabel = minutes === 1 ? 'minute' : 'minutes'
  const secondLabel = seconds === 1 ? 'second' : 'seconds'
  return `${minutes} ${minuteLabel} ${seconds} ${secondLabel} rest completed`
}
