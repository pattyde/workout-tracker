import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { ProgressionState } from '../domain/models/ProgressionState'

export async function updatePreferredBarType(
  exerciseDefinitionId: string,
  preferredBarTypeId: string,
  repository: ProgressionStateRepository
): Promise<ProgressionState> {
  const existing =
    await repository.getByExerciseDefinitionId(
      exerciseDefinitionId
    )
  if (!existing) {
    throw new Error('Progression state not found')
  }

  const updated: ProgressionState = {
    ...existing,
    preferredBarTypeId,
  }

  await repository.save(updated)
  return updated
}
