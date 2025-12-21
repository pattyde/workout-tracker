import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { Workout } from '../domain/models/Workout'

interface ActiveWorkoutViewProps {
  workout: Workout
  exerciseDefinitions: Record<string, ExerciseDefinition>
}

export default function ActiveWorkoutView({
  workout,
  exerciseDefinitions,
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
        />
      ))}
    </div>
  )
}

interface ExerciseCardProps {
  exerciseDefinitionName: string
  sets: Workout['exerciseInstances'][number]['sets']
}

function ExerciseCard({
  exerciseDefinitionName,
  sets,
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
}

function SetRow({
  index,
  targetWeight,
  targetReps,
  status,
}: SetRowProps) {
  return (
    <div>
      <div>Set {index + 1}</div>
      <div>
        {targetWeight} x {targetReps}
      </div>
      <div>Status: {status}</div>
    </div>
  )
}
