import type { StopwatchState } from './StopwatchState'

export interface AppState {
  /** Singleton ID (always the same value, e.g. "app") */
  id: 'app'

  /** Active stopwatch state, if any */
  activeStopwatch: StopwatchState | null

  /** Active workout id, if any */
  activeWorkoutId?: string

  /** Preferred unit for display */
  unitPreference: 'kg' | 'lb'

  /** UI theme preference */
  theme: 'light' | 'dark' | 'system'

  /** ID of the most recent workout, if any */
  lastWorkoutId?: string

  /** Variation of the most recently completed workout, if any */
  lastCompletedVariation?: 'A' | 'B'

  /** Global equipment inventory (bars and plates) */
  equipmentInventory?: EquipmentInventory
}

export interface EquipmentInventory {
  bars: EquipmentInventoryBar[]
  plates: EquipmentInventoryPlate[]
}

export interface EquipmentInventoryBar {
  id: string
  name: string
  weight: number
  unit: 'kg' | 'lb'
  enabled: boolean
}

export interface EquipmentInventoryPlate {
  weight: number
  unit: 'kg' | 'lb'
  quantity: number
}
