import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { AppState } from '../domain/models/AppState'
import { buildWorkoutExercises } from '../domain/workout/workoutBuilder'
import { getActiveWorkout } from './workoutLifecycleService'
import { getOrInitAppState } from './appStateService'

export interface SwitchWorkoutVariationParams {
  variation: Workout['variation']
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStates: Record<string, ProgressionState>
  workoutRepository: WorkoutRepository
  appStateRepository: AppStateRepository
}

export async function switchActiveWorkoutVariation(
  params: SwitchWorkoutVariationParams
): Promise<Workout> {
  const {
    variation,
    exerciseDefinitions,
    progressionStates,
    workoutRepository,
    appStateRepository,
  } = params

  const activeWorkout = await getActiveWorkout(
    workoutRepository,
    appStateRepository
  )
  if (!activeWorkout) {
    throw new Error('No active workout to switch')
  }

  if (activeWorkout.variation === variation) {
    return activeWorkout
  }

  const exerciseInstances = buildWorkoutExercises({
    workoutId: activeWorkout.id,
    variation,
    exerciseDefinitions,
    progressionStates,
  })

  const updatedWorkout: Workout = {
    ...activeWorkout,
    variation,
    exerciseInstances,
  }

  await workoutRepository.save(updatedWorkout)

  const appState = await getOrInitAppState(appStateRepository)
  const updatedAppState: AppState = {
    ...appState,
    lastCompletedVariation: variation,
  }
  await appStateRepository.save(updatedAppState)

  return updatedWorkout
}
