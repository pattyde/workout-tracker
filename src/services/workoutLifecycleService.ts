import type { ExerciseInstance } from '../domain/models/ExerciseInstance'
import type { Workout } from '../domain/models/Workout'
import type { AppState } from '../domain/models/AppState'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import { finishWorkout } from '../domain/workout/workoutTiming'

function createDefaultAppState(): AppState {
  return {
    id: 'app',
    activeStopwatch: null,
    unitPreference: 'kg',
    theme: 'system',
    activeWorkoutId: undefined,
    lastWorkoutId: undefined,
  }
}

async function getOrInitAppState(
  repository: AppStateRepository
): Promise<AppState> {
  const existing = await repository.get()
  if (existing) return existing

  // First launch: persist a default singleton AppState.
  const initial = createDefaultAppState()
  await repository.save(initial)
  return initial
}

export async function startWorkout(
  exerciseInstances: ExerciseInstance[],
  nowMs: number,
  workoutRepository: WorkoutRepository,
  appStateRepository: AppStateRepository
): Promise<Workout> {
  let appState = await getOrInitAppState(appStateRepository)

  if (appState.activeWorkoutId) {
    const active = await workoutRepository.getById(
      appState.activeWorkoutId
    )
    if (active && !active.completed) {
      return active
    }

    appState = {
      ...appState,
      activeWorkoutId: undefined,
    }
    await appStateRepository.save(appState)
  }

  const workoutId = crypto.randomUUID()
  const exerciseInstancesWithId = exerciseInstances.map(
    exercise => ({
      ...exercise,
      workoutId,
    })
  )

  const workout: Workout = {
    id: workoutId,
    dateMs: nowMs,
    exerciseInstances: exerciseInstancesWithId,
    startedAtMs: nowMs,
    completedAtMs: undefined,
    completed: false,
  }

  await workoutRepository.save(workout)

  const updatedState: AppState = {
    ...appState,
    activeWorkoutId: workout.id,
  }
  await appStateRepository.save(updatedState)

  return workout
}

export async function getActiveWorkout(
  workoutRepository: WorkoutRepository,
  appStateRepository: AppStateRepository
): Promise<Workout | null> {
  const appState = await getOrInitAppState(appStateRepository)
  if (!appState.activeWorkoutId) {
    return null
  }

  const workout = await workoutRepository.getById(
    appState.activeWorkoutId
  )
  if (!workout || workout.completed) {
    const cleared: AppState = {
      ...appState,
      activeWorkoutId: undefined,
    }
    await appStateRepository.save(cleared)
    return null
  }

  return workout
}

export async function completeActiveWorkout(
  nowMs: number,
  workoutRepository: WorkoutRepository,
  appStateRepository: AppStateRepository
): Promise<Workout | null> {
  const appState = await getOrInitAppState(appStateRepository)
  if (!appState.activeWorkoutId) {
    return null
  }

  const workout = await workoutRepository.getById(
    appState.activeWorkoutId
  )
  if (!workout) {
    const cleared: AppState = {
      ...appState,
      activeWorkoutId: undefined,
    }
    await appStateRepository.save(cleared)
    return null
  }

  const completedWorkout = finishWorkout(workout, nowMs)
  await workoutRepository.save(completedWorkout)

  const updatedState: AppState = {
    ...appState,
    activeWorkoutId: undefined,
    lastWorkoutId: completedWorkout.id,
  }
  await appStateRepository.save(updatedState)

  return completedWorkout
}

export async function abandonActiveWorkout(
  workoutRepository: WorkoutRepository,
  appStateRepository: AppStateRepository
): Promise<void> {
  const appState = await getOrInitAppState(appStateRepository)
  if (!appState.activeWorkoutId) {
    return
  }

  await workoutRepository.deleteById(appState.activeWorkoutId)

  const updatedState: AppState = {
    ...appState,
    activeWorkoutId: undefined,
  }
  await appStateRepository.save(updatedState)
}
