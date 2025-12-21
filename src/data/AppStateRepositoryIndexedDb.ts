import type { AppState } from '../domain/models/AppState'
import type { AppStateRepository } from './AppStateRepository'

const DB_NAME = 'workout-tracker'
const DB_VERSION = 1
const STORE_NAME = 'app_state'
const APP_STATE_ID = 'app'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
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

export class IndexedDbAppStateRepository
  implements AppStateRepository
{
  async get(): Promise<AppState | null> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const result = await requestToPromise(store.get(APP_STATE_ID))
    await transactionDone(tx)
    db.close()
    return (result ?? null) as AppState | null
  }

  async save(state: AppState): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.put(state))
    await transactionDone(tx)
    db.close()
  }
}
