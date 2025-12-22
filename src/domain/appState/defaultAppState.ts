import type {
  AppState,
  EquipmentInventory,
} from '../models/AppState'
import { listBarTypes } from '../bars/barTypes'

export function createDefaultEquipmentInventory(): EquipmentInventory {
  const bars = listBarTypes().map(bar => ({
    id: bar.id,
    name: bar.name,
    weight: bar.weight,
    unit: bar.unit,
    enabled: bar.id === 'olympic-20kg',
  }))

  const plates = [
    { weight: 20, unit: 'kg' as const, quantity: 2 },
    { weight: 10, unit: 'kg' as const, quantity: 2 },
    { weight: 5, unit: 'kg' as const, quantity: 2 },
    { weight: 2.5, unit: 'kg' as const, quantity: 2 },
    { weight: 1.25, unit: 'kg' as const, quantity: 2 },
    { weight: 0.5, unit: 'kg' as const, quantity: 2 },
  ]

  return {
    bars,
    plates,
  }
}

export function createDefaultAppState(): AppState {
  return {
    id: 'app',
    activeStopwatch: null,
    unitPreference: 'kg',
    theme: 'system',
    activeWorkoutId: undefined,
    lastWorkoutId: undefined,
    lastCompletedVariation: undefined,
    equipmentInventory: createDefaultEquipmentInventory(),
  }
}

export function withEquipmentInventory(
  appState: AppState
): AppState {
  if (appState.equipmentInventory) {
    return appState
  }

  return {
    ...appState,
    equipmentInventory: createDefaultEquipmentInventory(),
  }
}
