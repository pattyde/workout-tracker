import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import { getNextWorkoutVariation } from '../domain/workout/workoutVariation'
import { buildWorkoutExercises } from '../domain/workout/workoutBuilder'
import {
  getActiveWorkout,
  startWorkout,
} from './workoutLifecycleService'
import { getOrInitAppState } from './appStateService'

export interface StartOrResumeWorkoutParams {
  nowMs: number
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStates: Record<string, ProgressionState>
  workoutRepository: WorkoutRepository
  appStateRepository: AppStateRepository
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
