import type { StopwatchState } from './StopwatchState'

export interface AppState {
  /** Singleton ID (always the same value, e.g. "app") */
  id: 'app'

  /** Active stopwatch state, if any */
  activeStopwatch: StopwatchState | null

  /** Active workout id, if any */
  activeWorkoutId?: string

  /** Preferred unit for display */
  unitPreference: 'kg' | 'lb'

  /** UI theme preference */
  theme: 'light' | 'dark' | 'system'

  /** ID of the most recent workout, if any */
  lastWorkoutId?: string
}
