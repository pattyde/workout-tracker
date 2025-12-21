import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from './WorkoutRepository'

const DB_NAME = 'workout-tracker'
const DB_VERSION = 3
const STORE_NAME = 'workouts'
const APP_STATE_STORE = 'app_state'
const PROGRESSION_STORE = 'progression_state'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
        db.createObjectStore(APP_STATE_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PROGRESSION_STORE)) {
        db.createObjectStore(PROGRESSION_STORE, {
          keyPath: 'exerciseDefinitionId',
        })
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

export class IndexedDbWorkoutRepository
  implements WorkoutRepository
{
  async getById(id: string): Promise<Workout | null> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const result = await requestToPromise(store.get(id))
    await transactionDone(tx)
    db.close()
    return (result ?? null) as Workout | null
  }

  async listAll(): Promise<Workout[]> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const result = await requestToPromise(store.getAll())
    await transactionDone(tx)
    db.close()
    return (result as Workout[]).filter(
      workout => !workout.deleted
    )
  }

  async save(workout: Workout): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.put(workout))
    await transactionDone(tx)
    db.close()
  }

  async deleteById(id: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.delete(id))
    await transactionDone(tx)
    db.close()
  }
}
