import type { Workout } from '../domain/models/Workout'
import type { Set } from '../domain/models/Set'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import { getNextSetState } from '../domain/sets/setTap'

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

export async function applySetTapToWorkout(
  workout: Workout,
  setId: string,
  repository: WorkoutRepository
): Promise<Workout> {
  const updatedWorkout = updateSetInWorkout(
    workout,
    setId,
    set => ({
      ...set,
      ...getNextSetState(set),
    })
  )

  if (updatedWorkout !== workout) {
    await repository.save(updatedWorkout)
  }

  return updatedWorkout
}
