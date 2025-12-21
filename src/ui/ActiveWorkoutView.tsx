import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { Workout } from '../domain/models/Workout'

interface ActiveWorkoutViewProps {
  workout: Workout
  exerciseDefinitions: Record<string, ExerciseDefinition>
  onSetTap: (setId: string) => void
}

export default function ActiveWorkoutView({
  workout,
  exerciseDefinitions,
  onSetTap,
}: ActiveWorkoutViewProps) {
  const orderedExercises = [...workout.exerciseInstances].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  return (
    <div>
      <h1>Workout Tracker</h1>
      <h2>Variation {workout.variation}</h2>
      {orderedExercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exerciseDefinitionName={
            exerciseDefinitions[exercise.exerciseDefinitionId]
              ?.name ?? 'Unknown Exercise'
          }
          sets={exercise.sets}
          onSetTap={onSetTap}
        />
      ))}
    </div>
  )
}

interface ExerciseCardProps {
  exerciseDefinitionName: string
  sets: Workout['exerciseInstances'][number]['sets']
  onSetTap: (setId: string) => void
}

function ExerciseCard({
  exerciseDefinitionName,
  sets,
  onSetTap,
}: ExerciseCardProps) {
  const orderedSets = [...sets].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  return (
    <div>
      <h3>{exerciseDefinitionName}</h3>
      {orderedSets.map((set, index) => (
        <SetRow
          key={set.id}
          index={index}
          targetWeight={set.targetWeight}
          targetReps={set.targetReps}
          status={set.status}
          actualReps={set.actualReps}
          onTap={() => onSetTap(set.id)}
        />
      ))}
    </div>
  )
}

interface SetRowProps {
  index: number
  targetWeight: number
  targetReps: number
  status: Workout['exerciseInstances'][number]['sets'][number]['status']
  actualReps?: number
  onTap: () => void
}

function SetRow({
  index,
  targetWeight,
  targetReps,
  status,
  actualReps,
  onTap,
}: SetRowProps) {
  const repsDisplay =
    status === 'pending'
      ? targetReps
      : actualReps ?? targetReps

  return (
    <button type="button" onClick={onTap}>
      <div>Set {index + 1}</div>
      <div>
        {targetWeight} x {repsDisplay}
      </div>
      <div>Status: {status}</div>
    </button>
  )
}
