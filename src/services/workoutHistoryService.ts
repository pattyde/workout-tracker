import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { AppState } from '../domain/models/AppState'
import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import { getBarWeight } from '../domain/bars/barTypes'
import { calculateNextProgression } from '../domain/progression/progressionLogic'

export interface UpdateCompletedWorkoutParams {
  workoutId: string
  updatedWorkout: Workout
  workoutRepository: WorkoutRepository
  progressionStateRepository: ProgressionStateRepository
  appStateRepository: AppStateRepository
}

export interface SoftDeleteWorkoutParams {
  workoutId: string
  workoutRepository: WorkoutRepository
  progressionStateRepository: ProgressionStateRepository
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

function getExerciseSets(
  workout: Workout,
  exerciseDefinitionId: string
): Set[] | null {
  const exercise = workout.exerciseInstances.find(
    item => item.exerciseDefinitionId === exerciseDefinitionId
  )
  return exercise?.sets ?? null
}

function getExerciseInstance(
  workout: Workout,
  exerciseDefinitionId: string
): Workout['exerciseInstances'][number] | null {
  return (
    workout.exerciseInstances.find(
      item => item.exerciseDefinitionId === exerciseDefinitionId
    ) ?? null
  )
}

function findMostRecentWorkoutForExercise(
  workouts: Workout[],
  exerciseDefinitionId: string
): Workout | null {
  let latest: Workout | null = null

  for (const workout of workouts) {
    if (!workout.completed || workout.deleted) {
      continue
    }
    if (workout.completedAtMs == null) {
      continue
    }
    const hasExercise = workout.exerciseInstances.some(
      item => item.exerciseDefinitionId === exerciseDefinitionId
    )
    if (!hasExercise) {
      continue
    }

    if (!latest) {
      latest = workout
      continue
    }

    if (
      latest.completedAtMs != null &&
      workout.completedAtMs > latest.completedAtMs
    ) {
      latest = workout
    }
  }

  return latest
}

function findMostRecentCompletedWorkout(
  workouts: Workout[]
): Workout | null {
  let latest: Workout | null = null

  for (const workout of workouts) {
    if (!workout.completed || workout.deleted) {
      continue
    }
    if (workout.completedAtMs == null) {
      continue
    }

    if (!latest) {
      latest = workout
      continue
    }

    if (
      latest.completedAtMs != null &&
      workout.completedAtMs > latest.completedAtMs
    ) {
      latest = workout
    }
  }

  return latest
}

function applyEditableSetUpdates(
  base: Workout,
  updated: Workout
): Workout {
  const exerciseInstances = base.exerciseInstances.map(exercise => {
    const updatedExercise = updated.exerciseInstances.find(
      item => item.id === exercise.id
    )
    if (!updatedExercise) return exercise

    const sets = exercise.sets.map(set => {
      const updatedSet = updatedExercise.sets.find(
        item => item.id === set.id
      )
      if (!updatedSet) return set

      return {
        ...set,
        status: updatedSet.status,
        actualReps: updatedSet.actualReps,
      }
    })

    return { ...exercise, sets }
  })

  return {
    ...base,
    exerciseInstances,
  }
}

export async function updateCompletedWorkout(
  params: UpdateCompletedWorkoutParams
): Promise<Workout> {
  const {
    workoutId,
    updatedWorkout,
    workoutRepository,
    progressionStateRepository,
    appStateRepository,
  } = params

  const appState = await getOrInitAppState(appStateRepository)
  if (appState.activeWorkoutId === workoutId) {
    throw new Error('Cannot edit an active workout')
  }

  const existing = await workoutRepository.getById(workoutId)
  if (!existing) {
    throw new Error('Workout not found')
  }
  if (!existing.completed || existing.deleted) {
    throw new Error('Workout is not editable')
  }

  const mergedWorkout = applyEditableSetUpdates(
    existing,
    updatedWorkout
  )

  await workoutRepository.save(mergedWorkout)

  const allWorkouts = await workoutRepository.listAll()
  const affectedExercises = existing.exerciseInstances.map(
    exercise => exercise.exerciseDefinitionId
  )

  for (const exerciseDefinitionId of affectedExercises) {
    const mostRecent = findMostRecentWorkoutForExercise(
      allWorkouts,
      exerciseDefinitionId
    )

    if (!mostRecent || mostRecent.id !== workoutId) {
      continue
    }

    const sets = getExerciseSets(
      mergedWorkout,
      exerciseDefinitionId
    )
    const exercise = getExerciseInstance(
      mergedWorkout,
      exerciseDefinitionId
    )
    if (!sets || !exercise) {
      continue
    }

    const progression =
      await progressionStateRepository.getByExerciseDefinitionId(
        exerciseDefinitionId
      )
    if (!progression) {
      throw new Error(
        `Missing progression state for ${exerciseDefinitionId}`
      )
    }

    const barWeight = getBarWeight(exercise.barTypeId)
    const result = calculateNextProgression(
      progression,
      sets,
      barWeight
    )

    await progressionStateRepository.save({
      ...progression,
      currentWeight: result.nextWeight,
      failureStreak: result.nextFailureStreak,
    })
  }

  return mergedWorkout
}

export async function softDeleteWorkout(
  params: SoftDeleteWorkoutParams
): Promise<void> {
  const {
    workoutId,
    workoutRepository,
    progressionStateRepository,
    appStateRepository,
  } = params

  const appState = await getOrInitAppState(appStateRepository)
  if (appState.activeWorkoutId === workoutId) {
    throw new Error('Cannot delete an active workout')
  }

  const workout = await workoutRepository.getById(workoutId)
  if (!workout) {
    throw new Error('Workout not found')
  }
  if (!workout.completed || workout.deleted) {
    throw new Error('Workout is not deletable')
  }

  const allWorkouts = await workoutRepository.listAll()
  const affectedExercises = workout.exerciseInstances.map(
    exercise => exercise.exerciseDefinitionId
  )
  const mostRecentOverall =
    findMostRecentCompletedWorkout(allWorkouts)

  const needsRecalc = new Set<string>()
  for (const exerciseDefinitionId of affectedExercises) {
    const mostRecent = findMostRecentWorkoutForExercise(
      allWorkouts,
      exerciseDefinitionId
    )
    if (mostRecent?.id === workoutId) {
      needsRecalc.add(exerciseDefinitionId)
    }
  }

  const deletedWorkout = { ...workout, deleted: true }
  await workoutRepository.save(deletedWorkout)

  const remainingWorkouts = await workoutRepository.listAll()
  const newMostRecentOverall =
    findMostRecentCompletedWorkout(remainingWorkouts)

  if (mostRecentOverall?.id === workoutId) {
    const updatedAppState: AppState = {
      ...appState,
      lastCompletedVariation:
        newMostRecentOverall?.variation,
    }
    await appStateRepository.save(updatedAppState)
  }

  for (const exerciseDefinitionId of needsRecalc) {
    const mostRecent = findMostRecentWorkoutForExercise(
      remainingWorkouts,
      exerciseDefinitionId
    )
    if (!mostRecent) {
      continue
    }

    const exercise = getExerciseInstance(
      mostRecent,
      exerciseDefinitionId
    )
    if (!exercise) {
      continue
    }

    const progression =
      await progressionStateRepository.getByExerciseDefinitionId(
        exerciseDefinitionId
      )
    if (!progression) {
      throw new Error(
        `Missing progression state for ${exerciseDefinitionId}`
      )
    }

    const barWeight = getBarWeight(exercise.barTypeId)
    const result = calculateNextProgression(
      progression,
      exercise.sets,
      barWeight
    )

    await progressionStateRepository.save({
      ...progression,
      currentWeight: result.nextWeight,
      failureStreak: result.nextFailureStreak,
    })
  }
}
