import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import { getNextSetState } from '../domain/sets/setTap'
import { shouldAutoStartStopwatch } from '../domain/stopwatch/stopwatchAutoStart'
import { startOrRestartStopwatch } from './stopwatchService'

function updateSetInWorkout(
  workout: Workout,
  setId: string,
  updater: (set: Set) => Set
): Workout {
  let updated = false

  const exerciseInstances = workout.exerciseInstances.map(
    exercise => {
      let setsChanged = false
      const sets = exercise.sets.map(set => {
        if (set.id !== setId) return set
        updated = true
        setsChanged = true
        return updater(set)
      })

      return setsChanged ? { ...exercise, sets } : exercise
    }
  )

  if (!updated) {
    return workout
  }

  return {
    ...workout,
    exerciseInstances,
  }
}

function findSetById(
  workout: Workout,
  setId: string
): Set | null {
  for (const exercise of workout.exerciseInstances) {
    const match = exercise.sets.find(set => set.id === setId)
    if (match) return match
  }

  return null
}

export async function applySetTapToWorkout(
  workout: Workout,
  setId: string,
  workoutRepository: WorkoutRepository,
  appStateRepository: AppStateRepository,
  nowMs: number
): Promise<Workout> {
  const previousSet = findSetById(workout, setId)
  if (!previousSet) {
    return workout
  }

  const nextSet: Set = {
    ...previousSet,
    ...getNextSetState(previousSet),
  }

  const updatedWorkout = updateSetInWorkout(
    workout,
    setId,
    () => nextSet
  )

  if (updatedWorkout !== workout) {
    await workoutRepository.save(updatedWorkout)

    if (
      shouldAutoStartStopwatch(previousSet, nextSet)
    ) {
      await startOrRestartStopwatch(
        nowMs,
        appStateRepository
      )
    }
  }

  return updatedWorkout
}
