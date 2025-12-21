import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { ProgressionState } from '../domain/models/ProgressionState'

export async function updateProgressionIncrement(
  exerciseDefinitionId: string,
  plateIncrement: number,
  repository: ProgressionStateRepository
): Promise<ProgressionState> {
  if (!Number.isFinite(plateIncrement) || plateIncrement <= 0) {
    throw new Error('Increment must be a positive number')
  }

  const existing =
    await repository.getByExerciseDefinitionId(
      exerciseDefinitionId
    )
  if (!existing) {
    throw new Error('Progression state not found')
  }

  const updated: ProgressionState = {
    ...existing,
    plateIncrement,
  }

  await repository.save(updated)
  return updated
}
