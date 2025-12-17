import type { StopwatchState } from '../models/StopwatchState'
import type { NotificationEvent } from '../models/NotificationEvents'
import { getNewlyTriggeredAlerts } from './stopwatchLogic'

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
    type: 'rest-alert',
    thresholdSec,
    timestampMs: nowMs,
    message: buildRestAlertMessage(thresholdSec),
  }))
}

function buildRestAlertMessage(thresholdSec: number): string {
  if (thresholdSec < 60) {
    return `${thresholdSec}s rest completed`
  }

  const minutes = Math.floor(thresholdSec / 60)
  const seconds = thresholdSec % 60

  if (seconds === 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} rest completed`
  }

  return `${minutes}m ${seconds}s rest completed`
}
