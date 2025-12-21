import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'

export async function updateExerciseWorkWeight(
  workout: Workout,
  exerciseInstanceId: string,
  workWeight: number,
  repository: WorkoutRepository
): Promise<Workout> {
  let updated = false

  const exerciseInstances = workout.exerciseInstances.map(
    exercise => {
      if (exercise.id !== exerciseInstanceId) {
        return exercise
      }
      updated = true
      return {
        ...exercise,
        workWeight,
      }
    }
  )

  if (!updated) {
    return workout
  }

  const updatedWorkout: Workout = {
    ...workout,
    exerciseInstances,
  }

  await repository.save(updatedWorkout)
  return updatedWorkout
}
