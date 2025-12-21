import { useEffect, useState } from 'react'
import type { Workout } from '../domain/models/Workout'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { WorkoutRepository } from '../data/WorkoutRepository'

interface WorkoutHistoryScreenProps {
  workoutRepository: WorkoutRepository
  exerciseDefinitions: Record<string, ExerciseDefinition>
}

export default function WorkoutHistoryScreen({
  workoutRepository,
  exerciseDefinitions,
}: WorkoutHistoryScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] =
    useState<Workout | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const all = await workoutRepository.listAll()
        const completed = all
          .filter(workout => workout.completed)
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
        workout={selectedWorkout}
        exerciseDefinitions={exerciseDefinitions}
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
}

function WorkoutDetailsView({
  workout,
  exerciseDefinitions,
  onBack,
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
      <h2>Workout Details</h2>
      <div>{completedAt}</div>
      <div>Variation {workout.variation}</div>
      {orderedExercises.map(exercise => {
        const name =
          exerciseDefinitions[exercise.exerciseDefinitionId]
            ?.name ?? 'Unknown Exercise'
        const orderedSets = [...exercise.sets].sort(
          (a, b) => a.orderIndex - b.orderIndex
        )

        return (
          <div key={exercise.id}>
            <h3>{name}</h3>
            {orderedSets.map((set, index) => (
              <div key={set.id}>
                <div>Set {index + 1}</div>
                <div>
                  {set.targetWeight} x {set.targetReps}
                </div>
                <div>
                  Actual:{' '}
                  {set.actualReps != null
                    ? set.actualReps
                    : '—'}
                </div>
                <div>Status: {set.status}</div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
