import { describe, it, expect, beforeEach } from 'vitest'
import { IndexedDbAppStateRepository } from './AppStateRepositoryIndexedDb'
import type { AppState } from '../domain/models/AppState'

const DB_NAME = 'workout-tracker'

function makeAppState(
  overrides: Partial<AppState> = {}
): AppState {
  return {
    id: 'app',
    activeStopwatch: null,
    unitPreference: 'kg',
    theme: 'system',
    ...overrides,
  }
}

function deleteDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to delete database'))
    request.onblocked = () =>
      reject(new Error('Database deletion was blocked'))
  })
}

describe('IndexedDbAppStateRepository', () => {
  beforeEach(async () => {
    await deleteDb()
  })

  it('saves and loads app state', async () => {
    const repo = new IndexedDbAppStateRepository()
    const state = makeAppState({ unitPreference: 'lb' })

    await repo.save(state)

    const loaded = await repo.get()
    expect(loaded).toEqual(state)
  })

  it('returns null when no app state exists', async () => {
    const repo = new IndexedDbAppStateRepository()

    const loaded = await repo.get()
    expect(loaded).toBeNull()
  })

  it('overwrites existing app state', async () => {
    const repo = new IndexedDbAppStateRepository()
    const first = makeAppState({ unitPreference: 'kg' })
    const second = makeAppState({ unitPreference: 'lb' })

    await repo.save(first)
    await repo.save(second)

    const loaded = await repo.get()
    expect(loaded).toEqual(second)
  })
})
