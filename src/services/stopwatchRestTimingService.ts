import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import type { StopwatchState } from '../domain/models/StopwatchState'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import { getElapsedMs } from '../domain/stopwatch/stopwatchLogic'
import { handleSetCompletionForStopwatch } from '../domain/stopwatch/stopwatchTriggers'

export interface RestTimingResult {
  workout: Workout
  stopwatch: StopwatchState | null
}

function replaceSetInWorkout(
  workout: Workout,
  nextSet: Set
): Workout {
  let found = false

  const exerciseInstances = workout.exerciseInstances.map(
    exercise => {
      let setsChanged = false
      const sets = exercise.sets.map(set => {
        if (set.id !== nextSet.id) return set
        found = true
        setsChanged = true
        return nextSet
      })

      return setsChanged ? { ...exercise, sets } : exercise
    }
  )

  if (!found) {
    return workout
  }

  return {
    ...workout,
    exerciseInstances,
  }
}

function getSetById(
  workout: Workout,
  setId: string
): Set | null {
  for (const exercise of workout.exerciseInstances) {
    const match = exercise.sets.find(set => set.id === setId)
    if (match) return match
  }

  return null
}

function getOrderedEnabledSets(workout: Workout): Set[] {
  const exercises = [...workout.exerciseInstances].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )
  const ordered: Set[] = []

  for (const exercise of exercises) {
    const sets = [...exercise.sets].sort(
      (a, b) => a.orderIndex - b.orderIndex
    )
    for (const set of sets) {
      if (set.enabled) {
        ordered.push(set)
      }
    }
  }

  return ordered
}

function getPreviousEnabledSet(
  workout: Workout,
  currentSetId: string
): Set | null {
  const ordered = getOrderedEnabledSets(workout)
  const index = ordered.findIndex(set => set.id === currentSetId)
  if (index <= 0) return null
  return ordered[index - 1] ?? null
}

function applyRestToSet(
  workout: Workout,
  setId: string,
  restElapsedSeconds: number
): Workout {
  const target = getSetById(workout, setId)
  if (!target) return workout

  return replaceSetInWorkout(workout, {
    ...target,
    restElapsedSeconds,
  })
}

export async function applyRestTimingOnSetUpdate(
  previousWorkout: Workout,
  updatedSet: Set,
  currentStopwatch: StopwatchState | null,
  nowMs: number,
  repository: WorkoutRepository
): Promise<RestTimingResult> {
  const previousSet = getSetById(previousWorkout, updatedSet.id)
  if (!previousSet) {
    return { workout: previousWorkout, stopwatch: currentStopwatch }
  }

  let nextWorkout = replaceSetInWorkout(
    previousWorkout,
    updatedSet
  )

  let nextStopwatch = handleSetCompletionForStopwatch(
    previousSet,
    updatedSet,
    currentStopwatch,
    nowMs
  )

  const canRecordRest =
    updatedSet.enabled &&
    updatedSet.status === 'completed' &&
    previousSet.status !== 'completed' &&
    currentStopwatch != null &&
    !currentStopwatch.dismissed

  if (canRecordRest) {
    const previousEnabledSet = getPreviousEnabledSet(
      previousWorkout,
      updatedSet.id
    )

    if (previousEnabledSet) {
      const elapsedSeconds = Math.floor(
        getElapsedMs(currentStopwatch, nowMs) / 1000
      )

      if (elapsedSeconds > 0) {
        nextWorkout = applyRestToSet(
          nextWorkout,
          previousEnabledSet.id,
          elapsedSeconds
        )
      }
    }
  }

  await repository.save(nextWorkout)

  return { workout: nextWorkout, stopwatch: nextStopwatch }
}

export async function applyRestTimingOnWorkoutCompletion(
  previousWorkout: Workout,
  completedWorkout: Workout,
  currentStopwatch: StopwatchState | null,
  nowMs: number,
  repository: WorkoutRepository
): Promise<RestTimingResult> {
  if (!completedWorkout.completed || previousWorkout.completed) {
    return {
      workout: completedWorkout,
      stopwatch: currentStopwatch,
    }
  }

  let nextWorkout = completedWorkout
  let nextStopwatch = currentStopwatch

  const canRecordRest =
    currentStopwatch != null && !currentStopwatch.dismissed

  if (canRecordRest) {
    const ordered = getOrderedEnabledSets(completedWorkout)
    const lastEnabledSet = ordered[ordered.length - 1]

    if (lastEnabledSet && lastEnabledSet.status === 'completed') {
      const elapsedSeconds = Math.floor(
        getElapsedMs(currentStopwatch, nowMs) / 1000
      )

      if (elapsedSeconds > 0) {
        nextWorkout = applyRestToSet(
          nextWorkout,
          lastEnabledSet.id,
          elapsedSeconds
        )
      }
    }
  }

  await repository.save(nextWorkout)

  return { workout: nextWorkout, stopwatch: nextStopwatch }
}
