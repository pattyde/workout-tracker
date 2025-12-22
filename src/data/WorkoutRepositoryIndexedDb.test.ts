import { describe, it, expect, beforeEach } from 'vitest'
import { IndexedDbWorkoutRepository } from './WorkoutRepositoryIndexedDb'
import type { Workout } from '../domain/models/Workout'

const DB_NAME = 'workout-tracker'

function makeWorkout(id: string): Workout {
  return {
    id,
    dateMs: 0,
    exerciseInstances: [],
    variation: 'A',
    completed: false,
  }
}

function deleteDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to delete database'))
    request.onblocked = () =>
      reject(new Error('Database deletion was blocked'))
  })
}

describe('IndexedDbWorkoutRepository', () => {
  beforeEach(async () => {
    await deleteDb()
  })

  it('saves and loads a workout by id', async () => {
    const repo = new IndexedDbWorkoutRepository()
    const workout = makeWorkout('w1')

    await repo.save(workout)

    const loaded = await repo.getById('w1')
    expect(loaded).toEqual(workout)
  })

  it('returns null for missing workout', async () => {
    const repo = new IndexedDbWorkoutRepository()

    const loaded = await repo.getById('missing')
    expect(loaded).toBeNull()
  })

  it('lists all workouts', async () => {
    const repo = new IndexedDbWorkoutRepository()
    const workouts: [Workout, Workout] = [
      makeWorkout('a'),
      makeWorkout('b'),
    ]
    const [first, second] = workouts

    await repo.save(first)
    await repo.save(second)

    const all = await repo.listAll()
    const ids = all.map(w => w.id).sort()

    expect(ids).toEqual(['a', 'b'])
  })

  it('deletes a workout by id', async () => {
    const repo = new IndexedDbWorkoutRepository()
    const workout = makeWorkout('w2')

    await repo.save(workout)
    await repo.deleteById('w2')

    const loaded = await repo.getById('w2')
    expect(loaded).toBeNull()
  })
})
