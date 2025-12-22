import type { StopwatchState } from '../domain/models/StopwatchState'
import type { NotificationEvent } from '../domain/models/NotificationEvents'
import { useStopwatchElapsed } from './hooks/useStopwatchElapsed'
import Button from './Button'

interface StopwatchDisplayProps {
  stopwatch: StopwatchState
  onEvents?: (events: NotificationEvent[]) => void
  onStopwatchUpdate?: (stopwatch: StopwatchState) => void
  onDismiss?: () => void
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
  onDismiss,
}: StopwatchDisplayProps) {
  const elapsedSeconds = useStopwatchElapsed(stopwatch, {
    onEvents,
    onStopwatchUpdate,
  })
  const thresholds = [...stopwatch.alertThresholdsSec].sort(
    (a, b) => a - b
  )
  const nextThreshold = thresholds.find(
    threshold => threshold > elapsedSeconds
  )
  const secondsToNext =
    nextThreshold != null ? nextThreshold - elapsedSeconds : null
  const emphasis =
    secondsToNext == null
      ? 'overdue'
      : secondsToNext <= 10
        ? 'approaching'
        : 'normal'

  const background =
    emphasis === 'overdue'
      ? '#fee2e2'
      : emphasis === 'approaching'
        ? '#dbeafe'
        : '#e0f2fe'
  const border =
    emphasis === 'overdue'
      ? '2px solid #fca5a5'
      : emphasis === 'approaching'
        ? '2px solid #93c5fd'
        : '2px solid #38bdf8'

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: '16px',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 40,
        pointerEvents: 'none',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          border,
          borderRadius: '12px',
          background,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '48px',
          width: '100%',
          maxWidth: '360px',
          justifyContent: 'space-between',
          pointerEvents: 'auto',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#555' }}>
            Rest
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            {formatElapsed(elapsedSeconds)}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={onDismiss}
          disabled={!onDismiss}
          aria-label="Dismiss rest timer"
          style={{
            minHeight: '48px',
            minWidth: '48px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            lineHeight: 1,
          }}
        >
          ×
        </Button>
      </div>
    </div>
  )
}

export { formatElapsed }
