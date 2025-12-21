import { useEffect, useMemo, useState } from 'react'
import type { ExerciseDefinition } from './domain/models/ExerciseDefinitions'
import type { ProgressionState } from './domain/models/ProgressionState'
import type { Workout } from './domain/models/Workout'
import type { AppState } from './domain/models/AppState'
import { IndexedDbWorkoutRepository } from './data/WorkoutRepositoryIndexedDb'
import { IndexedDbAppStateRepository } from './data/AppStateRepositoryIndexedDb'
import {
  STRONGLIFTS_5X5_EXERCISES,
  STRONGLIFTS_5X5_INITIAL_PROGRESSIONS,
} from './domain/programs/stronglifts5x5Seed'
import { startOrResumeWorkout } from './services/startOrResumeWorkoutService'
import ActiveWorkoutView from './ui/ActiveWorkoutView'
import { applySetTapToWorkout } from './services/setTapService'
import { StopwatchDisplay } from './ui/StopwatchDisplay'
import type { NotificationEvent } from './domain/models/NotificationEvents'
import {
  updateActiveStopwatch,
  dismissActiveStopwatch,
} from './services/stopwatchService'

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
  const [activeStopwatch, setActiveStopwatch] =
    useState<AppState['activeStopwatch']>(null)
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
          const appState =
            await appStateRepository.get()
          setActiveStopwatch(
            appState?.activeStopwatch ?? null
          )
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
    <div>
      {activeStopwatch?.startTime != null &&
        !activeStopwatch.dismissed && (
          <StopwatchDisplay
            stopwatch={activeStopwatch}
            onEvents={(events: NotificationEvent[]) => {
              events.forEach(event => {
                console.info(
                  `[Rest Alert] ${event.message}`
                )
              })
            }}
            onStopwatchUpdate={updatedStopwatch => {
              setActiveStopwatch(updatedStopwatch)
              void updateActiveStopwatch(
                updatedStopwatch,
                appStateRepository
              )
            }}
            onDismiss={() => {
              void dismissActiveStopwatch(
                appStateRepository
              ).then(updatedAppState => {
                setActiveStopwatch(
                  updatedAppState.activeStopwatch ?? null
                )
              })
            }}
          />
        )}
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
          const appState =
            await appStateRepository.get()
          setActiveStopwatch(
            appState?.activeStopwatch ?? null
          )
        }}
      />
    </div>
  )
}

function App() {
  return <AppBootstrap />
}

export default App
