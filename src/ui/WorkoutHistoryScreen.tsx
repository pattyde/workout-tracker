import { useEffect, useRef, useState } from 'react'
import type { Workout } from '../domain/models/Workout'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import { getNextSetState } from '../domain/sets/setTap'
import { getExerciseWorkWeight } from '../domain/exercises/workWeight'
import {
  softDeleteWorkout,
  updateCompletedWorkout,
} from '../services/workoutHistoryService'
import Button from './Button'

interface WorkoutHistoryScreenProps {
  workoutRepository: WorkoutRepository
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStateRepository: ProgressionStateRepository
  appStateRepository: AppStateRepository
  onBack: () => void
}

export default function WorkoutHistoryScreen({
  workoutRepository,
  exerciseDefinitions,
  progressionStateRepository,
  appStateRepository,
  onBack,
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
        onWorkWeightChange={(exerciseInstanceId, workWeight) => {
          if (!draftWorkout) return
          setDraftWorkout(
            updateWorkWeightInWorkout(
              draftWorkout,
              exerciseInstanceId,
              workWeight
            )
          )
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
    return (
      <div
        style={{
          padding: '16px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minHeight: '48px',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              color: '#2563EB',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: '1.3rem',
                lineHeight: 1,
                marginRight: '4px',
              }}
            >
              ‹
            </span>
            Back
          </button>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#111827',
              pointerEvents: 'none',
            }}
          >
            History
          </div>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          No completed workouts yet
        </div>
        <div style={{ color: '#555', marginTop: '6px' }}>
          Start a workout to see your history here.
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '32px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          minHeight: '48px',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '1rem',
            color: '#2563EB',
            cursor: 'pointer',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: '1.3rem',
              lineHeight: 1,
              marginRight: '4px',
            }}
          >
            ‹
          </span>
          Back
        </button>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#111827',
            pointerEvents: 'none',
          }}
        >
          History
        </div>
      </div>
      {workouts.map(workout => (
        <WorkoutSummaryRow
          key={workout.id}
          workout={workout}
          exerciseDefinitions={exerciseDefinitions}
          onSelect={() => setSelectedWorkout(workout)}
        />
      ))}
    </div>
  )
}

interface WorkoutSummaryRowProps {
  workout: Workout
  exerciseDefinitions: Record<string, ExerciseDefinition>
  onSelect: () => void
}

function WorkoutSummaryRow({
  workout,
  exerciseDefinitions,
  onSelect,
}: WorkoutSummaryRowProps) {
  const completedAt = workout.completedAtMs
    ? formatWorkoutDate(workout.completedAtMs)
    : 'Unknown date'

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Workout ${workout.variation} on ${completedAt}`}
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        color: 'inherit',
        font: 'inherit',
        border: '1px solid #d6d6d6',
        borderRadius: '12px',
        padding: '16px',
        background: '#f9f9f9',
        textAlign: 'left',
        minHeight: '72px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          width: '100%',
          columnGap: '12px',
          alignItems: 'center',
          fontSize: '0.9rem',
          color: '#666',
        }}
      >
        <div style={{ minWidth: 0 }}>{`Workout ${workout.variation}`}</div>
        <div
          style={{
            whiteSpace: 'nowrap',
            textAlign: 'right',
            justifySelf: 'end',
          }}
        >
          {completedAt}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        {workout.exerciseInstances.map((exercise, index) => {
          const definition =
            exerciseDefinitions[exercise.exerciseDefinitionId]
          const name = definition?.name ?? 'Unknown Exercise'
          const unit = definition?.defaultUnit ?? 'kg'
          const scheme = getSetScheme(exercise.sets)
          const weight =
            getExerciseWorkWeight(exercise) ??
            exercise.sets[0]?.targetWeight
          return (
            <div
              key={exercise.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                width: '100%',
                columnGap: '12px',
                alignItems: 'center',
                paddingTop: index === 0 ? 0 : '8px',
                marginTop: index === 0 ? 0 : '8px',
                borderTop:
                  index === 0 ? 'none' : '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontWeight: 600, minWidth: 0 }}>
                {name}
              </div>
              <div
                style={{
                  color: '#555',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                  justifySelf: 'end',
                }}
              >
                {scheme}{' '}
                {weight != null ? `${weight} ${unit}` : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </button>
  )
}

function getSetScheme(sets: Workout['exerciseInstances'][number]['sets']): string {
  const setCount = sets.length
  const reps = sets[0]?.targetReps ?? 0
  return `${setCount}×${reps}`
}

function formatWorkoutDate(timestampMs: number): string {
  const date = new Date(timestampMs)
  const today = new Date()
  const isToday =
    date.toDateString() === today.toDateString()

  if (isToday) {
    return `Today, ${date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })}`
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
  onWorkWeightChange: (
    exerciseInstanceId: string,
    workWeight: number
  ) => void
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
  onWorkWeightChange,
  isEditing,
}: WorkoutDetailsViewProps) {
  const completedAt = workout.completedAtMs
    ? new Date(workout.completedAtMs).toLocaleString()
    : 'Unknown date'
  const orderedExercises = [...workout.exerciseInstances].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )
  const [editingExerciseId, setEditingExerciseId] =
    useState<string | null>(null)
  const [draftWorkWeight, setDraftWorkWeight] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!editingExerciseId) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [editingExerciseId])

  useEffect(() => {
    if (!editingExerciseId) return
    const input = inputRef.current
    if (input) {
      input.focus()
      input.select()
    }
  }, [editingExerciseId])

  useEffect(() => {
    if (!isEditing) {
      setEditingExerciseId(null)
      setDraftWorkWeight('')
    }
  }, [isEditing])

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '32px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '48px',
          gap: '12px',
        }}
      >
        <div style={{ minWidth: '96px' }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1rem',
              color: '#2563EB',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: '1.3rem',
                lineHeight: 1,
                marginRight: '4px',
              }}
            >
              ‹
            </span>
            Back
          </button>
        </div>
        <div
          style={{
            flex: '1 1 auto',
            textAlign: 'center',
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Workout {workout.variation}
        </div>
        <div
          style={{
            minWidth: '96px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {!isEditing && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit workout"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '1rem',
                color: '#2563EB',
                cursor: 'pointer',
              }}
            >
              <span aria-hidden="true">✎</span>
              Edit
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ color: '#666' }}>{completedAt}</div>
      </div>
      {orderedExercises.map(exercise => {
        const name =
          exerciseDefinitions[exercise.exerciseDefinitionId]
            ?.name ?? 'Unknown Exercise'
        const unit =
          exerciseDefinitions[exercise.exerciseDefinitionId]
            ?.defaultUnit ?? 'kg'
        const workWeight = getExerciseWorkWeight(exercise)
        const orderedSets = [...exercise.sets].sort(
          (a, b) => a.orderIndex - b.orderIndex
        )

        return (
          <div
            key={exercise.id}
            style={{
              border: '1px solid #d6d6d6',
              borderRadius: '12px',
              padding: '12px',
              background: '#f9f9f9',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <h3 style={{ margin: 0 }}>{name}</h3>
              {isEditing ? (
                <button
                  type="button"
                  aria-label="Edit work weight"
                  onClick={() => {
                    setEditingExerciseId(exercise.id)
                    setDraftWorkWeight(
                      workWeight != null ? String(workWeight) : ''
                    )
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #c9c9c9',
                    borderRadius: '10px',
                    background: '#ffffff',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600,
                  }}
                >
                  {workWeight != null
                    ? `${workWeight} ${unit}`
                    : '—'}
                </button>
              ) : (
                <div
                  aria-label="Work weight"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #c9c9c9',
                    borderRadius: '10px',
                    background: '#ffffff',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600,
                  }}
                >
                  {workWeight != null
                    ? `${workWeight} ${unit}`
                    : '—'}
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'nowrap',
              }}
            >
              {orderedSets.map((set, index) => (
                <WorkoutDetailsSetTile
                  key={set.id}
                  index={index}
                  targetReps={set.targetReps}
                  status={set.status}
                  actualReps={set.actualReps}
                  isEditing={isEditing}
                  onTap={() => onSetTap(set.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
      {isEditing ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            onClick={onSave}
            style={{ width: '100%' }}
          >
            Save changes
          </Button>
          <Button
            variant="secondary"
            onClick={onCancelEdit}
            style={{ width: '100%' }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="danger"
          onClick={onDelete}
          style={{ width: '100%' }}
        >
          Delete workout
        </Button>
      )}
      {isEditing && editingExerciseId && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 30,
            }}
            aria-hidden="true"
            onClick={() => {
              setEditingExerciseId(null)
              setDraftWorkWeight('')
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-work-weight-editor"
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 31,
            }}
          >
            <div
              style={{
                border: '1px solid #d4d4d4',
                borderRadius: '12px',
                background: '#f9f9f9',
                padding: '12px',
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                id="history-work-weight-editor"
                style={{ fontWeight: 700 }}
              >
                Edit work weight
              </div>
              <label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <input
                    ref={inputRef}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={draftWorkWeight}
                    onChange={event =>
                      setDraftWorkWeight(event.target.value)
                    }
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5f6',
                      minHeight: '48px',
                      width: '100%',
                    }}
                  />
                  <span
                    style={{ color: '#666', fontSize: '1rem' }}
                  >
                    {exerciseDefinitions[
                      workout.exerciseInstances.find(
                        exercise =>
                          exercise.id === editingExerciseId
                      )?.exerciseDefinitionId ?? ''
                    ]?.defaultUnit ?? 'kg'}
                  </span>
                </div>
              </label>
              <Button
                variant="primary"
                onClick={() => {
                  const next = Number(draftWorkWeight)
                  if (!Number.isFinite(next)) return
                  onWorkWeightChange(editingExerciseId, next)
                  setEditingExerciseId(null)
                  setDraftWorkWeight('')
                }}
                style={{ width: '100%', minHeight: '48px' }}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingExerciseId(null)
                  setDraftWorkWeight('')
                }}
                style={{ width: '100%', minHeight: '48px' }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
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

function updateWorkWeightInWorkout(
  workout: Workout,
  exerciseInstanceId: string,
  workWeight: number
): Workout {
  const exerciseInstances = workout.exerciseInstances.map(
    exercise => {
      if (exercise.id !== exerciseInstanceId) {
        return exercise
      }
      return {
        ...exercise,
        workWeight,
      }
    }
  )

  return {
    ...workout,
    exerciseInstances,
  }
}

interface WorkoutDetailsSetTileProps {
  index: number
  targetReps: number
  status: Workout['exerciseInstances'][number]['sets'][number]['status']
  actualReps?: number
  isEditing: boolean
  onTap: () => void
}

function WorkoutDetailsSetTile({
  index,
  targetReps,
  status,
  actualReps,
  isEditing,
  onTap,
}: WorkoutDetailsSetTileProps) {
  const repsDisplay =
    status === 'pending'
      ? targetReps
      : actualReps ?? targetReps
  const isPending = status === 'pending'

  if (!isEditing) {
    return (
      <div
        aria-label={`Set ${index + 1}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 6px',
          borderRadius: '10px',
          border: isPending
            ? '1px dashed #cfcfcf'
            : '1px solid #e2e2e2',
          background: isPending ? '#f6f6f6' : '#ffffff',
          minHeight: '52px',
          flex: '1 1 0',
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: '1.05rem',
            fontWeight: isPending ? 500 : 700,
            color: isPending ? '#888' : '#111',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {repsDisplay}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Set ${index + 1}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 6px',
        borderRadius: '10px',
        border: isPending
          ? '1px dashed #cfcfcf'
          : '1px solid #e2e2e2',
        background: isPending ? '#f6f6f6' : '#ffffff',
        minHeight: '52px',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: '1.05rem',
          fontWeight: isPending ? 500 : 700,
          color: isPending ? '#888' : '#111',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {repsDisplay}
      </div>
    </button>
  )
}
