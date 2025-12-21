import type { ExerciseDefinition } from '../models/ExerciseDefinitions'
import type { ProgressionState } from '../models/ProgressionState'

export const STRONGLIFTS_5X5_EXERCISES: ExerciseDefinition[] =
  [
    {
      id: 'squat',
      name: 'Squat',
      defaultPlateIncrement: 2.5,
      defaultUnit: 'kg',
      createdAtMs: 0,
      archived: false,
    },
    {
      id: 'bench-press',
      name: 'Bench Press',
      defaultPlateIncrement: 2.5,
      defaultUnit: 'kg',
      createdAtMs: 0,
      archived: false,
    },
    {
      id: 'barbell-row',
      name: 'Barbell Row',
      defaultPlateIncrement: 2.5,
      defaultUnit: 'kg',
      createdAtMs: 0,
      archived: false,
    },
    {
      id: 'overhead-press',
      name: 'Overhead Press',
      defaultPlateIncrement: 2.5,
      defaultUnit: 'kg',
      createdAtMs: 0,
      archived: false,
    },
    {
      id: 'deadlift',
      name: 'Deadlift',
      defaultPlateIncrement: 2.5,
      defaultUnit: 'kg',
      createdAtMs: 0,
      archived: false,
    },
  ]

export const STRONGLIFTS_5X5_INITIAL_PROGRESSIONS: ProgressionState[] =
  [
    {
      id: 'progression-squat',
      exerciseDefinitionId: 'squat',
      currentWeight: 20,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    {
      id: 'progression-bench-press',
      exerciseDefinitionId: 'bench-press',
      currentWeight: 20,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    {
      id: 'progression-overhead-press',
      exerciseDefinitionId: 'overhead-press',
      currentWeight: 20,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    {
      id: 'progression-barbell-row',
      exerciseDefinitionId: 'barbell-row',
      currentWeight: 20,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
    {
      id: 'progression-deadlift',
      exerciseDefinitionId: 'deadlift',
      currentWeight: 40,
      failureStreak: 0,
      plateIncrement: 2.5,
      unit: 'kg',
    },
  ]
