import { useEffect, useState } from 'react'
import type { Workout } from '../domain/models/Workout'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import { getNextSetState } from '../domain/sets/setTap'
import {
  softDeleteWorkout,
  updateCompletedWorkout,
} from '../services/workoutHistoryService'

interface WorkoutHistoryScreenProps {
  workoutRepository: WorkoutRepository
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStateRepository: ProgressionStateRepository
  appStateRepository: AppStateRepository
}

export default function WorkoutHistoryScreen({
  workoutRepository,
  exerciseDefinitions,
  progressionStateRepository,
  appStateRepository,
}: WorkoutHistoryScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] =
    useState<Workout | null>(null)
  const [draftWorkout, setDraftWorkout] =
    useState<Workout | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const all = await workoutRepository.listAll()
        const completed = all
          .filter(
            workout => workout.completed && !workout.deleted
          )
          .sort((a, b) => {
            const aTime = a.completedAtMs ?? 0
            const bTime = b.completedAtMs ?? 0
            return bTime - aTime
          })

        if (!cancelled) {
          setWorkouts(completed)
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

    load()

    return () => {
      cancelled = true
    }
  }, [workoutRepository])

  if (loading) {
    return <div>Loading history...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (selectedWorkout) {
    return (
      <WorkoutDetailsView
        workout={isEditing && draftWorkout ? draftWorkout : selectedWorkout}
        exerciseDefinitions={exerciseDefinitions}
        isEditing={isEditing}
        onEdit={() => {
          setDraftWorkout(selectedWorkout)
          setIsEditing(true)
        }}
        onCancelEdit={() => {
          setDraftWorkout(null)
          setIsEditing(false)
        }}
        onSetTap={setId => {
          if (!draftWorkout) return
          setDraftWorkout(
            updateSetInWorkout(draftWorkout, setId)
          )
        }}
        onSave={async () => {
          if (!draftWorkout || !selectedWorkout) return
          try {
            const updated = await updateCompletedWorkout({
              workoutId: selectedWorkout.id,
              updatedWorkout: draftWorkout,
              workoutRepository,
              progressionStateRepository,
              appStateRepository,
            })
            setSelectedWorkout(updated)
            setDraftWorkout(null)
            setIsEditing(false)
            setWorkouts(current =>
              current.map(workout =>
                workout.id === updated.id ? updated : workout
              )
            )
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Unknown error'
            setError(message)
          }
        }}
        onDelete={async () => {
          const ok = window.confirm(
            'Delete this workout?'
          )
          if (!ok || !selectedWorkout) return
          try {
            await softDeleteWorkout({
              workoutId: selectedWorkout.id,
              workoutRepository,
              progressionStateRepository,
              appStateRepository,
            })
            setSelectedWorkout(null)
            setDraftWorkout(null)
            setIsEditing(false)
            const remaining = await workoutRepository.listAll()
            setWorkouts(
              remaining.filter(
                workout => workout.completed && !workout.deleted
              )
            )
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Unknown error'
            setError(message)
          }
        }}
        onBack={() => setSelectedWorkout(null)}
      />
    )
  }

  if (workouts.length === 0) {
    return <div>No completed workouts yet</div>
  }

  return (
    <div>
      <h2>Workout History</h2>
      {workouts.map(workout => (
      <WorkoutSummaryRow
          key={workout.id}
          workout={workout}
          onSelect={() => setSelectedWorkout(workout)}
        />
      ))}
    </div>
  )
}

interface WorkoutSummaryRowProps {
  workout: Workout
  onSelect: () => void
}

function WorkoutSummaryRow({
  workout,
  onSelect,
}: WorkoutSummaryRowProps) {
  const completedAt = workout.completedAtMs
    ? new Date(workout.completedAtMs).toLocaleString()
    : 'Unknown date'
  const exerciseCount = workout.exerciseInstances.length

  return (
    <button type="button" onClick={onSelect}>
      <div>{completedAt}</div>
      <div>Variation {workout.variation}</div>
      <div>{exerciseCount} exercises</div>
    </button>
  )
}

interface WorkoutDetailsViewProps {
  workout: Workout
  exerciseDefinitions: Record<string, ExerciseDefinition>
  onBack: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onDelete: () => void
  onSetTap: (setId: string) => void
  isEditing: boolean
}

function WorkoutDetailsView({
  workout,
  exerciseDefinitions,
  onBack,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onSetTap,
  isEditing,
}: WorkoutDetailsViewProps) {
  const completedAt = workout.completedAtMs
    ? new Date(workout.completedAtMs).toLocaleString()
    : 'Unknown date'
  const orderedExercises = [...workout.exerciseInstances].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  return (
    <div>
      <button type="button" onClick={onBack}>
        Back
      </button>
      {isEditing ? (
        <div>
          <button type="button" onClick={onSave}>
            Save changes
          </button>
          <button type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={onDelete}>
            Delete workout
          </button>
        </div>
      )}
      <h2>Workout Details</h2>
      <div>{completedAt}</div>
      <div>Variation {workout.variation}</div>
      {orderedExercises.map(exercise => {
        const name =
          exerciseDefinitions[exercise.exerciseDefinitionId]
            ?.name ?? 'Unknown Exercise'
        const unit =
          exerciseDefinitions[exercise.exerciseDefinitionId]
            ?.defaultUnit ?? 'kg'
        const workWeight =
          exercise.sets.find(set => set.type === 'work')
            ?.targetWeight ?? null
        const orderedSets = [...exercise.sets].sort(
          (a, b) => a.orderIndex - b.orderIndex
        )

        return (
          <div key={exercise.id}>
            <h3>{name}</h3>
            <div>
              Work weight:{' '}
              {workWeight != null
                ? `${workWeight} ${unit}`
                : '—'}
            </div>
            {orderedSets.map((set, index) => (
              <button
                key={set.id}
                type="button"
                onClick={() => onSetTap(set.id)}
                disabled={!isEditing}
              >
                <div>Set {index + 1}</div>
                <div>
                  Reps:{' '}
                  {set.actualReps != null
                    ? set.actualReps
                    : set.targetReps}
                </div>
                <div>
                  Actual:{' '}
                  {set.actualReps != null
                    ? set.actualReps
                    : '—'}
                </div>
                <div>Status: {set.status}</div>
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function updateSetInWorkout(
  workout: Workout,
  setId: string
): Workout {
  const exerciseInstances = workout.exerciseInstances.map(
    exercise => {
      let changed = false
      const sets = exercise.sets.map(set => {
        if (set.id !== setId) return set
        changed = true
        return {
          ...set,
          ...getNextSetState(set),
        }
      })

      return changed ? { ...exercise, sets } : exercise
    }
  )

  return {
    ...workout,
    exerciseInstances,
  }
}
