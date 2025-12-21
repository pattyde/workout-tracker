import type { ExerciseDefinition } from '../models/ExerciseDefinitions'
import type { ExerciseInstance } from '../models/ExerciseInstance'
import type { ProgressionState } from '../models/ProgressionState'
import type { Set } from '../models/Set'
import type { Workout } from '../models/Workout'
import { STRONGLIFTS_5X5 } from '../programs/stronglifts5x5'

export interface BuildWorkoutExercisesParams {
  workoutId: string
  variation: Workout['variation']
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStates: Record<string, ProgressionState>
}

const DEFAULT_BAR_TYPE_ID = 'olympic-20kg'

export function buildWorkoutExercises(
  params: BuildWorkoutExercisesParams
): ExerciseInstance[] {
  const { workoutId, variation, exerciseDefinitions, progressionStates } =
    params

  const exerciseOrder = STRONGLIFTS_5X5.variations[variation]

  return exerciseOrder.map((exerciseDefinitionId, index) => {
    const definition = exerciseDefinitions[exerciseDefinitionId]
    if (!definition) {
      throw new Error(
        `Missing ExerciseDefinition: ${exerciseDefinitionId}`
      )
    }

    const progression = progressionStates[exerciseDefinitionId]
    if (!progression) {
      throw new Error(
        `Missing ProgressionState: ${exerciseDefinitionId}`
      )
    }

    const scheme =
      STRONGLIFTS_5X5.setSchemes[exerciseDefinitionId]
    if (!scheme) {
      throw new Error(
        `Missing set scheme: ${exerciseDefinitionId}`
      )
    }

    const sets: Set[] = Array.from(
      { length: scheme.sets },
      (_, setIndex) => ({
        id: crypto.randomUUID(),
        orderIndex: setIndex,
        type: 'work',
        enabled: true,
        targetWeight: progression.currentWeight,
        targetReps: scheme.reps,
        status: 'pending',
      })
    )

    return {
      id: crypto.randomUUID(),
      exerciseDefinitionId: definition.id,
      workoutId,
      orderIndex: index,
      sets,
      workWeight: progression.currentWeight,
      barTypeId: DEFAULT_BAR_TYPE_ID,
      useSharedBarLoading: false,
    }
  })
}
