import { useEffect, useMemo, useState } from 'react'
import type { ExerciseDefinition } from './domain/models/ExerciseDefinitions'
import type { ProgressionState } from './domain/models/ProgressionState'
import type { Workout } from './domain/models/Workout'
import { IndexedDbWorkoutRepository } from './data/WorkoutRepositoryIndexedDb'
import { IndexedDbAppStateRepository } from './data/AppStateRepositoryIndexedDb'
import {
  STRONGLIFTS_5X5_EXERCISES,
  STRONGLIFTS_5X5_INITIAL_PROGRESSIONS,
} from './domain/programs/stronglifts5x5Seed'
import { startOrResumeWorkout } from './services/startOrResumeWorkoutService'
import ActiveWorkoutView from './ui/ActiveWorkoutView'
import { applySetTapToWorkout } from './services/setTapService'

function buildDefinitionMap(
  definitions: ExerciseDefinition[]
): Record<string, ExerciseDefinition> {
  return definitions.reduce(
    (acc, definition) => {
      acc[definition.id] = definition
      return acc
    },
    {} as Record<string, ExerciseDefinition>
  )
}

function buildProgressionMap(
  progressions: ProgressionState[]
): Record<string, ProgressionState> {
  return progressions.reduce(
    (acc, progression) => {
      acc[progression.exerciseDefinitionId] = progression
      return acc
    },
    {} as Record<string, ProgressionState>
  )
}

function AppBootstrap() {
  const workoutRepository = useMemo(
    () => new IndexedDbWorkoutRepository(),
    []
  )
  const appStateRepository = useMemo(
    () => new IndexedDbAppStateRepository(),
    []
  )
  const exerciseDefinitions = useMemo(
    () => buildDefinitionMap(STRONGLIFTS_5X5_EXERCISES),
    []
  )
  const progressionStates = useMemo(
    () =>
      buildProgressionMap(
        STRONGLIFTS_5X5_INITIAL_PROGRESSIONS
      ),
    []
  )

  const [workout, setWorkout] = useState<Workout | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const activeWorkout = await startOrResumeWorkout({
          nowMs: Date.now(),
          exerciseDefinitions,
          progressionStates,
          workoutRepository,
          appStateRepository,
        })

        if (!cancelled) {
          setWorkout(activeWorkout)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Unknown error'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [
    exerciseDefinitions,
    progressionStates,
    workoutRepository,
    appStateRepository,
  ])

  if (loading) {
    return <div>Loading workout...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!workout) {
    return <div>No active workout found.</div>
  }

  return (
    <ActiveWorkoutView
      workout={workout}
      exerciseDefinitions={exerciseDefinitions}
      onSetTap={async setId => {
        if (!workout) return
        const updated = await applySetTapToWorkout(
          workout,
          setId,
          workoutRepository,
          appStateRepository,
          Date.now()
        )
        setWorkout(updated)
      }}
    />
  )
}

function App() {
  return <AppBootstrap />
}

export default App
