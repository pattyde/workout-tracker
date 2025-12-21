import type { AppStateRepository } from '../data/AppStateRepository'
import type { AppState } from '../domain/models/AppState'
import {
  createDefaultAppState,
  withEquipmentInventory,
} from '../domain/appState/defaultAppState'

export async function getOrInitAppState(
  repository: AppStateRepository
): Promise<AppState> {
  const existing = await repository.get()
  if (!existing) {
    const initial = createDefaultAppState()
    await repository.save(initial)
    return initial
  }

  const withInventory = withEquipmentInventory(existing)
  if (withInventory !== existing) {
    await repository.save(withInventory)
  }

  return withInventory
}
