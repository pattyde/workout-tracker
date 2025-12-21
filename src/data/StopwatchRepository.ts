import type { StopwatchState } from '../domain/models/StopwatchState'

export interface StopwatchRepository {
  getActive(): Promise<StopwatchState | null>
  saveActive(state: StopwatchState): Promise<void>
  clearActive(): Promise<void>
}
