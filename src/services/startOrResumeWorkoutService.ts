import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { AppState } from '../domain/models/AppState'
import { getNextWorkoutVariation } from '../domain/workout/workoutVariation'
import { buildWorkoutExercises } from '../domain/workout/workoutBuilder'
import {
  getActiveWorkout,
  startWorkout,
} from './workoutLifecycleService'

export interface StartOrResumeWorkoutParams {
  nowMs: number
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStates: Record<string, ProgressionState>
  workoutRepository: WorkoutRepository
  appStateRepository: AppStateRepository
}

function createDefaultAppState(): AppState {
  return {
    id: 'app',
    activeStopwatch: null,
    unitPreference: 'kg',
    theme: 'system',
    activeWorkoutId: undefined,
    lastWorkoutId: undefined,
    lastCompletedVariation: undefined,
  }
}

async function getOrInitAppState(
  repository: AppStateRepository
): Promise<AppState> {
  const existing = await repository.get()
  if (existing) return existing

  const initial = createDefaultAppState()
  await repository.save(initial)
  return initial
}

export async function startOrResumeWorkout(
  params: StartOrResumeWorkoutParams
): Promise<Workout> {
  const {
    nowMs,
    exerciseDefinitions,
    progressionStates,
    workoutRepository,
    appStateRepository,
  } = params

  const active = await getActiveWorkout(
    workoutRepository,
    appStateRepository
  )
  if (active) {
    return active
  }

  const appState = await getOrInitAppState(appStateRepository)
  const variation =
    appState.lastCompletedVariation === 'A'
      ? 'B'
      : appState.lastCompletedVariation === 'B'
        ? 'A'
        : getNextWorkoutVariation(
            await workoutRepository.listAll()
          )

  const exerciseInstances = buildWorkoutExercises({
    workoutId: 'pending',
    variation,
    exerciseDefinitions,
    progressionStates,
  })

  return startWorkout(
    exerciseInstances,
    variation,
    nowMs,
    workoutRepository,
    appStateRepository
  )
}
