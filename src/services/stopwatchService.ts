import type { AppState } from '../domain/models/AppState'
import type { AppStateRepository } from '../data/AppStateRepository'
import { startStopwatch } from '../domain/stopwatch/stopwatchLogic'

function createDefaultAppState(): AppState {
  return {
    id: 'app',
    activeStopwatch: null,
    unitPreference: 'kg',
    theme: 'system',
    activeWorkoutId: undefined,
    lastWorkoutId: undefined,
  }
}

async function getOrInitAppState(
  repository: AppStateRepository
): Promise<AppState> {
  const existing = await repository.get()
  if (existing) return existing

  const initial = createDefaultAppState()
  await repository.save(initial)
  return initial
}

export async function startOrRestartStopwatch(
  nowMs: number,
  appStateRepository: AppStateRepository
): Promise<AppState> {
  const appState = await getOrInitAppState(appStateRepository)

  const updated: AppState = {
    ...appState,
    activeStopwatch: startStopwatch(nowMs),
  }

  await appStateRepository.save(updated)
  return updated
}

export async function updateActiveStopwatch(
  stopwatch: AppState['activeStopwatch'],
  appStateRepository: AppStateRepository
): Promise<AppState> {
  const appState = await getOrInitAppState(appStateRepository)
  const updated: AppState = {
    ...appState,
    activeStopwatch: stopwatch,
  }
  await appStateRepository.save(updated)
  return updated
}
