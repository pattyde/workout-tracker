import type { ProgressionState } from '../domain/models/ProgressionState'

export interface ProgressionStateRepository {
  getByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<ProgressionState | null>
  listAll(): Promise<ProgressionState[]>
  save(state: ProgressionState): Promise<void>
  deleteByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<void>
}
