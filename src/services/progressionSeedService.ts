import type { ProgressionState } from '../domain/models/ProgressionState'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'

export async function ensureProgressionSeed(
  seed: ProgressionState[],
  repository: ProgressionStateRepository
): Promise<void> {
  for (const entry of seed) {
    const existing =
      await repository.getByExerciseDefinitionId(
        entry.exerciseDefinitionId
      )
    if (!existing) {
      await repository.save(entry)
    }
  }
}
