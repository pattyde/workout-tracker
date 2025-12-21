import type { ProgressionState } from '../domain/models/ProgressionState'
import type { ProgressionStateRepository } from './ProgressionStateRepository'

const DB_NAME = 'workout-tracker'
const DB_VERSION = 3
const STORE_NAME = 'progression_state'
const WORKOUT_STORE = 'workouts'
const APP_STATE_STORE = 'app_state'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'exerciseDefinitionId',
        })
      }
      if (!db.objectStoreNames.contains(WORKOUT_STORE)) {
        db.createObjectStore(WORKOUT_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
        db.createObjectStore(APP_STATE_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open database'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () =>
      reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () =>
      reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export class IndexedDbProgressionStateRepository
  implements ProgressionStateRepository
{
  async getByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<ProgressionState | null> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const result = await requestToPromise(
      store.get(exerciseDefinitionId)
    )
    await transactionDone(tx)
    db.close()
    return (result ?? null) as ProgressionState | null
  }

  async listAll(): Promise<ProgressionState[]> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const result = await requestToPromise(store.getAll())
    await transactionDone(tx)
    db.close()
    return result as ProgressionState[]
  }

  async save(state: ProgressionState): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.put(state))
    await transactionDone(tx)
    db.close()
  }

  async deleteByExerciseDefinitionId(
    exerciseDefinitionId: string
  ): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.delete(exerciseDefinitionId))
    await transactionDone(tx)
    db.close()
  }
}
