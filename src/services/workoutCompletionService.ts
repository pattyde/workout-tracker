import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { Workout } from '../domain/models/Workout'
import { dismissStopwatch } from '../domain/stopwatch/stopwatchLogic'
import { finishWorkout } from '../domain/workout/workoutTiming'
import { calculateNextProgression } from '../domain/progression/progressionLogic'
import { getBarWeight } from '../domain/bars/barTypes'
import { getOrInitAppState } from './appStateService'

export interface CompleteActiveWorkoutParams {
  nowMs: number
  workoutRepository: WorkoutRepository
  progressionStateRepository: ProgressionStateRepository
  appStateRepository: AppStateRepository
}

import type { AppState } from '../domain/models/AppState'

export async function completeActiveWorkout(
  params: CompleteActiveWorkoutParams
): Promise<Workout> {
  const {
    nowMs,
    workoutRepository,
    progressionStateRepository,
    appStateRepository,
  } = params

  const appState = await getOrInitAppState(appStateRepository)
  const activeWorkoutId = appState.activeWorkoutId
  if (!activeWorkoutId) {
    throw new Error('No active workout to complete')
  }

  const workout = await workoutRepository.getById(
    activeWorkoutId
  )
  if (!workout) {
    throw new Error('Active workout not found')
  }

  const progressionUpdates = []
  for (const exercise of workout.exerciseInstances) {
    const progression =
      await progressionStateRepository.getByExerciseDefinitionId(
        exercise.exerciseDefinitionId
      )
    if (!progression) {
      throw new Error(
        `Missing progression state for ${exercise.exerciseDefinitionId}`
      )
    }

    const barWeight = getBarWeight(exercise.barTypeId)
    const result = calculateNextProgression(
      { ...progression, currentWeight: exercise.workWeight },
      exercise.sets,
      barWeight
    )

    progressionUpdates.push({
      ...progression,
      currentWeight: result.nextWeight,
      failureStreak: result.nextFailureStreak,
    })
  }

  const completedWorkout = finishWorkout(workout, nowMs)
  const dismissedStopwatch = appState.activeStopwatch
    ? dismissStopwatch(appState.activeStopwatch)
    : null

  const updatedAppState: AppState = {
    ...appState,
    activeWorkoutId: undefined,
    lastWorkoutId: completedWorkout.id,
    lastCompletedVariation: completedWorkout.variation,
    activeStopwatch: dismissedStopwatch,
  }

  await workoutRepository.save(completedWorkout)
  for (const update of progressionUpdates) {
    await progressionStateRepository.save(update)
  }
  await appStateRepository.save(updatedAppState)

  return completedWorkout
}
