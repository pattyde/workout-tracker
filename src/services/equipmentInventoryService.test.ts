import { beforeEach, describe, expect, it } from 'vitest'
import type {
  AppState,
  EquipmentInventory,
} from '../domain/models/AppState'
import type { AppStateRepository } from '../data/AppStateRepository'
import { IndexedDbAppStateRepository } from '../data/AppStateRepositoryIndexedDb'
import {
  createDefaultEquipmentInventory,
  createDefaultAppState,
} from '../domain/appState/defaultAppState'
import { listBarTypes } from '../domain/bars/barTypes'
import { getOrInitAppState } from './appStateService'
import { updateEquipmentInventory } from './equipmentInventoryService'

const DB_NAME = 'workout-tracker'

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

describe('equipment inventory', () => {
  beforeEach(async () => {
    await deleteDb()
  })

  it('applies default inventory on first run', async () => {
    const repo = new MemoryAppStateRepository()

    const appState = await getOrInitAppState(repo)

    expect(appState.equipmentInventory).toEqual(
      createDefaultEquipmentInventory()
    )
  })

  it('keeps disabled bars stored by default', async () => {
    const repo = new MemoryAppStateRepository()

    const appState = await getOrInitAppState(repo)
    const inventory = appState.equipmentInventory

    if (!inventory) {
      throw new Error('Expected inventory')
    }

    const barTypes = listBarTypes()
    expect(inventory.bars).toHaveLength(barTypes.length)
    const enabledBars = inventory.bars.filter(
      bar => bar.enabled
    )
    expect(enabledBars.map(bar => bar.id)).toEqual([
      'olympic-20kg',
    ])
  })

  it('persists equipment inventory updates', async () => {
    const repo = new MemoryAppStateRepository()
    const base = createDefaultAppState()
    await repo.save(base)

    const inventory: EquipmentInventory = {
      bars: [
        {
          id: 'olympic-20kg',
          name: 'Olympic bar',
          weight: 20,
          unit: 'kg',
          enabled: false,
        },
      ],
      plates: [
        { weight: 20, unit: 'kg', quantity: 4 },
      ],
    }

    const updated = await updateEquipmentInventory(
      inventory,
      repo
    )

    expect(updated.equipmentInventory).toEqual(inventory)
    expect(repo.state?.equipmentInventory).toEqual(inventory)
  })

  it('survives app restarts', async () => {
    const firstRepo = new IndexedDbAppStateRepository()
    const inventory: EquipmentInventory = {
      bars: [
        {
          id: 'olympic-20kg',
          name: 'Olympic bar',
          weight: 20,
          unit: 'kg',
          enabled: true,
        },
      ],
      plates: [
        { weight: 5, unit: 'kg', quantity: 6 },
      ],
    }

    await updateEquipmentInventory(inventory, firstRepo)

    const secondRepo = new IndexedDbAppStateRepository()
    const loaded = await secondRepo.get()

    expect(loaded?.equipmentInventory).toEqual(inventory)
  })
})
