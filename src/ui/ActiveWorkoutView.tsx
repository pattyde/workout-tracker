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
          unit={
            exerciseDefinitions[exercise.exerciseDefinitionId]
              ?.defaultUnit ?? 'kg'
          }
          workWeight={
            exercise.sets.find(set => set.type === 'work')
              ?.targetWeight ?? null
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
  unit: ExerciseDefinition['defaultUnit']
  workWeight: number | null
  onSetTap: (setId: string) => void
}

function ExerciseCard({
  exerciseDefinitionName,
  sets,
  unit,
  workWeight,
  onSetTap,
}: ExerciseCardProps) {
  const orderedSets = [...sets].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  return (
    <div>
      <h3>{exerciseDefinitionName}</h3>
      <div>
        Work weight:{' '}
        {workWeight != null ? `${workWeight} ${unit}` : '—'}
      </div>
      {orderedSets.map((set, index) => (
        <SetRow
          key={set.id}
          index={index}
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
  targetReps: number
  status: Workout['exerciseInstances'][number]['sets'][number]['status']
  actualReps?: number
  onTap: () => void
}

function SetRow({
  index,
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
      <div>Reps: {repsDisplay}</div>
      <div>Status: {status}</div>
    </button>
  )
}
