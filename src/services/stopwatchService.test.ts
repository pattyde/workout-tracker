import { describe, it, expect } from 'vitest'
import { startOrRestartStopwatch } from './stopwatchService'
import type { AppState } from '../domain/models/AppState'
import type { AppStateRepository } from '../data/AppStateRepository'

class MemoryAppStateRepository implements AppStateRepository {
  public state: AppState | null = null

  async get(): Promise<AppState | null> {
    return this.state
  }

  async save(state: AppState): Promise<void> {
    this.state = state
  }

  async clear(): Promise<void> {
    this.state = null
  }
}

describe('startOrRestartStopwatch', () => {
  it('starts stopwatch and persists app state', async () => {
    const repo = new MemoryAppStateRepository()

    const appState = await startOrRestartStopwatch(1000, repo)

    expect(appState.activeStopwatch?.startTime).toBe(1000)
    expect(appState.activeStopwatch?.accumulatedMs).toBe(0)
    expect(appState.activeStopwatch?.dismissed).toBe(false)
    expect(appState.activeStopwatch?.firedThresholdsSec).toEqual(
      []
    )
    expect(appState.activeStopwatch?.alertThresholdsSec).toEqual(
      [90, 180, 300]
    )
  })

  it('restarts stopwatch cleanly on repeat start', async () => {
    const repo = new MemoryAppStateRepository()
    await startOrRestartStopwatch(1000, repo)

    if (!repo.state) {
      throw new Error('Expected app state')
    }

    repo.state = {
      ...repo.state,
      activeStopwatch: {
        startTime: 1000,
        accumulatedMs: 5000,
        alertThresholdsSec: [90],
        firedThresholdsSec: [90],
        dismissed: true,
      },
    }

    const appState = await startOrRestartStopwatch(2000, repo)

    expect(appState.activeStopwatch?.startTime).toBe(2000)
    expect(appState.activeStopwatch?.accumulatedMs).toBe(0)
    expect(appState.activeStopwatch?.dismissed).toBe(false)
    expect(appState.activeStopwatch?.firedThresholdsSec).toEqual(
      []
    )
  })
})
