import type { AppStateRepository } from '../data/AppStateRepository'
import type {
  AppState,
  EquipmentInventory,
} from '../domain/models/AppState'
import { getOrInitAppState } from './appStateService'

export async function updateEquipmentInventory(
  inventory: EquipmentInventory,
  appStateRepository: AppStateRepository
): Promise<AppState> {
  const appState = await getOrInitAppState(appStateRepository)
  const updated: AppState = {
    ...appState,
    equipmentInventory: inventory,
  }

  await appStateRepository.save(updated)
  return updated
}
