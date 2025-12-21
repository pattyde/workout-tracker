import { describe, it, expect } from 'vitest'
import { updateProgressionIncrement } from './progressionIncrementService'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'

class MemoryProgressionStateRepository
  implements ProgressionStateRepository
{
  public store = new Map<string, ProgressionState>()

  async getByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<ProgressionState | null> {
    return this.store.get(exerciseDefinitionId) ?? null
  }

  async listAll(): Promise<ProgressionState[]> {
    return Array.from(this.store.values())
  }

  async save(state: ProgressionState): Promise<void> {
    this.store.set(state.exerciseDefinitionId, state)
  }

  async deleteByExerciseDefinitionId(): Promise<void> {}
}

describe('updateProgressionIncrement', () => {
  it('persists updated increment', async () => {
    const repo = new MemoryProgressionStateRepository()
    await repo.save({
      id: 'p1',
      exerciseDefinitionId: 'squat',
      currentWeight: 100,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    })

    const updated = await updateProgressionIncrement(
      'squat',
      5,
      repo
    )

    expect(updated.plateIncrement).toBe(5)
    const stored =
      await repo.getByExerciseDefinitionId('squat')
    expect(stored?.plateIncrement).toBe(5)
  })
})
