import { useEffect, useMemo, useState } from 'react'
import type { ExerciseDefinition } from './domain/models/ExerciseDefinitions'
import type { ProgressionState } from './domain/models/ProgressionState'
import type { Workout } from './domain/models/Workout'
import type {
  AppState,
  EquipmentInventory,
} from './domain/models/AppState'
import { IndexedDbWorkoutRepository } from './data/WorkoutRepositoryIndexedDb'
import { IndexedDbAppStateRepository } from './data/AppStateRepositoryIndexedDb'
import { IndexedDbProgressionStateRepository } from './data/ProgressionStateRepositoryIndexedDb'
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
import { completeActiveWorkout } from './services/workoutCompletionService'
import { ensureProgressionSeed } from './services/progressionSeedService'
import WorkoutHistoryScreen from './ui/WorkoutHistoryScreen'
import { updateExerciseWorkWeight } from './services/exerciseWorkWeightService'
import ProgressionIncrementScreen from './ui/ProgressionIncrementScreen'
import { getOrInitAppState } from './services/appStateService'
import { getActiveWorkout } from './services/workoutLifecycleService'
import HomeScreen from './ui/HomeScreen'
import { switchActiveWorkoutVariation } from './services/workoutVariationService'

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
  const progressionStateRepository = useMemo(
    () => new IndexedDbProgressionStateRepository(),
    []
  )
  const exerciseDefinitions = useMemo(
    () => buildDefinitionMap(STRONGLIFTS_5X5_EXERCISES),
    []
  )
  const [progressionStates, setProgressionStates] =
    useState<Record<string, ProgressionState>>({})
  const [equipmentInventory, setEquipmentInventory] =
    useState<EquipmentInventory | null>(null)

  const [workout, setWorkout] = useState<Workout | null>(
    null
  )
  const [activeStopwatch, setActiveStopwatch] =
    useState<AppState['activeStopwatch']>(null)
  const [completionError, setCompletionError] = useState<
    string | null
  >(null)
  const [completing, setCompleting] = useState(false)
  const [view, setView] = useState<
    'home' | 'active' | 'history' | 'progression'
  >('home')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        await ensureProgressionSeed(
          STRONGLIFTS_5X5_INITIAL_PROGRESSIONS,
          progressionStateRepository
        )
        const progressions =
          await progressionStateRepository.listAll()
        const progressionMap = buildProgressionMap(
          progressions
        )
        setProgressionStates(progressionMap)

        const activeWorkout = await getActiveWorkout(
          workoutRepository,
          appStateRepository
        )
        if (!cancelled) {
          setWorkout(activeWorkout)
          const appState = await getOrInitAppState(
            appStateRepository
          )
          setActiveStopwatch(
            appState?.activeStopwatch ?? null
          )
          setEquipmentInventory(
            appState?.equipmentInventory ?? null
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
    workoutRepository,
    appStateRepository,
    progressionStateRepository,
  ])

  useEffect(() => {
    if (view !== 'active') return
    let cancelled = false

    async function refreshState() {
      try {
        const [appState, progressions] =
          await Promise.all([
            getOrInitAppState(appStateRepository),
            progressionStateRepository.listAll(),
          ])
        if (!cancelled) {
          setEquipmentInventory(
            appState.equipmentInventory ?? null
          )
          setProgressionStates(
            buildProgressionMap(progressions)
          )
        }
      } catch {
        if (!cancelled) {
          setEquipmentInventory(null)
        }
      }
    }

    refreshState()

    return () => {
      cancelled = true
    }
  }, [view, appStateRepository, progressionStateRepository])

  if (loading) {
    return <div>Loading workout...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (view === 'home') {
    return (
      <HomeScreen
        hasActiveWorkout={Boolean(workout)}
        onResume={async () => {
          const activeWorkout = await getActiveWorkout(
            workoutRepository,
            appStateRepository
          )
          if (!activeWorkout) {
            setWorkout(null)
            return
          }
          setWorkout(activeWorkout)
          setView('active')
        }}
        onStartNew={async () => {
          const activeWorkout = await startOrResumeWorkout({
            nowMs: Date.now(),
            exerciseDefinitions,
            progressionStates,
            workoutRepository,
            appStateRepository,
          })
          setWorkout(activeWorkout)
          setView('active')
        }}
        onViewHistory={() => setView('history')}
        onViewSettings={() => setView('progression')}
      />
    )
  }

  if (view === 'history') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView('active')}
        >
          Back to Workout
        </button>
        <WorkoutHistoryScreen
          workoutRepository={workoutRepository}
          exerciseDefinitions={exerciseDefinitions}
          progressionStateRepository={progressionStateRepository}
          appStateRepository={appStateRepository}
        />
      </div>
    )
  }
  if (view === 'progression') {
    return (
      <ProgressionIncrementScreen
        exerciseDefinitions={exerciseDefinitions}
        progressionStateRepository={progressionStateRepository}
        appStateRepository={appStateRepository}
        onBack={() => setView('active')}
      />
    )
  }

  if (!workout) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView('home')}
        >
          Back to Home
        </button>
        <div>No active workout found.</div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setView('home')}
      >
        Back to Home
      </button>
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
        progressionStates={progressionStates}
        equipmentInventory={
          equipmentInventory ?? { bars: [], plates: [] }
        }
        onVariationChange={async variation => {
          if (!workout) return
          const updated = await switchActiveWorkoutVariation(
            {
              variation,
              exerciseDefinitions,
              progressionStates,
              workoutRepository,
              appStateRepository,
            }
          )
          setWorkout(updated)
        }}
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
          const appState = await getOrInitAppState(
            appStateRepository
          )
          setActiveStopwatch(
            appState?.activeStopwatch ?? null
          )
        }}
        onWorkWeightSave={async (exerciseInstanceId, workWeight) => {
          if (!workout) return
          const updated = await updateExerciseWorkWeight(
            workout,
            exerciseInstanceId,
            workWeight,
            workoutRepository
          )
          setWorkout(updated)
        }}
      />
      <button
        type="button"
        onClick={async () => {
          if (!workout || completing) return
          setCompleting(true)
          setCompletionError(null)
          try {
            await completeActiveWorkout({
              nowMs: Date.now(),
              workoutRepository,
              progressionStateRepository,
              appStateRepository,
            })
            const updatedProgressions =
              await progressionStateRepository.listAll()
            setProgressionStates(
              buildProgressionMap(updatedProgressions)
            )
            setWorkout(null)
            setActiveStopwatch(null)
            setView('home')
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'Unknown error'
            setCompletionError(message)
          } finally {
            setCompleting(false)
          }
        }}
        disabled={completing}
      >
        {completing ? 'Completing...' : 'Complete Workout'}
      </button>
      {completionError && (
        <div>Error: {completionError}</div>
      )}
    </div>
  )
}

function App() {
  return <AppBootstrap />
}

export default App
