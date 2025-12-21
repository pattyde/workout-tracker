import type { AppState } from '../domain/models/AppState'

export interface AppStateRepository {
  get(): Promise<AppState | null>
  save(state: AppState): Promise<void>
  clear(): Promise<void>
}
