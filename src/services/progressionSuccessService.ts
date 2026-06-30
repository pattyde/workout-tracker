import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { ProgressionState } from '../domain/models/ProgressionState'

export async function updateSuccessesRequired(
  exerciseDefinitionId: string,
  successesRequired: number,
  repository: ProgressionStateRepository
): Promise<ProgressionState> {
  if (
    !Number.isInteger(successesRequired) ||
    successesRequired < 1
  ) {
    throw new Error('Successes required must be a whole number of 1 or more')
  }

  const existing =
    await repository.getByExerciseDefinitionId(exerciseDefinitionId)
  if (!existing) {
    throw new Error('Progression state not found')
  }

  const updated: ProgressionState = {
    ...existing,
    successesRequired,
  }

  await repository.save(updated)
  return updated
}
