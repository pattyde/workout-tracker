import type { AppStateRepository } from '../data/AppStateRepository'
import { startStopwatch } from '../domain/stopwatch/stopwatchLogic'
import { dismissStopwatch } from '../domain/stopwatch/stopwatchLogic'
import type { AppState } from '../domain/models/AppState'
import { getOrInitAppState } from './appStateService'

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

export async function dismissActiveStopwatch(
  appStateRepository: AppStateRepository
): Promise<AppState> {
  const appState = await getOrInitAppState(appStateRepository)
  if (!appState.activeStopwatch) {
    return appState
  }

  const updated: AppState = {
    ...appState,
    activeStopwatch: dismissStopwatch(
      appState.activeStopwatch
    ),
  }

  await appStateRepository.save(updated)
  return updated
}
