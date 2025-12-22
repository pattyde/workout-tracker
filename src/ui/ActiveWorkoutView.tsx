import { useEffect, useState } from 'react'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { Workout } from '../domain/models/Workout'
import { getBarType } from '../domain/bars/barTypes'
import { calculateInventoryPlateStack } from '../domain/calculations/inventoryPlateCalculator'
import { getExerciseWorkWeight } from '../domain/exercises/workWeight'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { EquipmentInventory } from '../domain/models/AppState'

interface ActiveWorkoutViewProps {
  workout: Workout
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStates: Record<string, ProgressionState>
  equipmentInventory: EquipmentInventory
  onSetTap: (setId: string) => void
  onWorkWeightSave: (
    exerciseInstanceId: string,
    workWeight: number
  ) => void
}

export default function ActiveWorkoutView({
  workout,
  exerciseDefinitions,
  progressionStates,
  equipmentInventory,
  onSetTap,
  onWorkWeightSave,
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
          exerciseInstanceId={exercise.id}
          exerciseDefinitionName={
            exerciseDefinitions[exercise.exerciseDefinitionId]
              ?.name ?? 'Unknown Exercise'
          }
          unit={
            exerciseDefinitions[exercise.exerciseDefinitionId]
              ?.defaultUnit ?? 'kg'
          }
          preferredBarTypeId={
            progressionStates[exercise.exerciseDefinitionId]
              ?.preferredBarTypeId ?? 'olympic-20kg'
          }
          equipmentInventory={equipmentInventory}
          workWeight={getExerciseWorkWeight(exercise)}
          sets={exercise.sets}
          onSetTap={onSetTap}
          onWorkWeightSave={onWorkWeightSave}
        />
      ))}
    </div>
  )
}

interface ExerciseCardProps {
  exerciseInstanceId: string
  exerciseDefinitionName: string
  sets: Workout['exerciseInstances'][number]['sets']
  unit: ExerciseDefinition['defaultUnit']
  preferredBarTypeId: string
  equipmentInventory: EquipmentInventory
  workWeight: number | null
  onSetTap: (setId: string) => void
  onWorkWeightSave: (
    exerciseInstanceId: string,
    workWeight: number
  ) => void
}

function ExerciseCard({
  exerciseInstanceId,
  exerciseDefinitionName,
  sets,
  unit,
  preferredBarTypeId,
  equipmentInventory,
  workWeight,
  onSetTap,
  onWorkWeightSave,
}: ExerciseCardProps) {
  const orderedSets = [...sets].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )
  const [isEditingWeight, setIsEditingWeight] =
    useState(false)
  const [draftWeight, setDraftWeight] = useState(
    workWeight != null ? String(workWeight) : ''
  )
  const [weightError, setWeightError] = useState<
    string | null
  >(null)
  const [showCalculator, setShowCalculator] =
    useState(false)

  useEffect(() => {
    if (!isEditingWeight) {
      setDraftWeight(
        workWeight != null ? String(workWeight) : ''
      )
    }
  }, [workWeight, isEditingWeight])

  const handleSaveWeight = () => {
    const parsed = Number(draftWeight)
    if (!Number.isFinite(parsed)) {
      setWeightError('Enter a valid number')
      return
    }
    setWeightError(null)
    onWorkWeightSave(exerciseInstanceId, parsed)
    setIsEditingWeight(false)
  }

  return (
    <div>
      <h3>{exerciseDefinitionName}</h3>
      {isEditingWeight ? (
        <div
          style={{
            display: 'inline-block',
            padding: '6px 10px',
            border: '1px solid #c9c9c9',
            borderRadius: '6px',
            background: '#f7f7f7',
            marginBottom: '8px',
          }}
        >
          <label>
            Work weight
            <div>
              <input
                type="number"
                step="any"
                value={draftWeight}
                onChange={event =>
                  setDraftWeight(event.target.value)
                }
              />{' '}
              {unit}
            </div>
          </label>
          {weightError && <div>{weightError}</div>}
          <div>
            <button type="button" onClick={handleSaveWeight}>
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftWeight(
                  workWeight != null
                    ? String(workWeight)
                    : ''
                )
                setWeightError(null)
                setIsEditingWeight(false)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setIsEditingWeight(true)}
            aria-label="Edit work weight"
            style={{
              display: 'inline-block',
              padding: '6px 10px',
              border: '1px solid #c9c9c9',
              borderRadius: '6px',
              background: '#f7f7f7',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontSize: '0.85rem' }}>
              Work weight
            </div>
            <div style={{ fontWeight: 600 }}>
              {workWeight != null
                ? `${workWeight} ${unit}`
                : '—'}
            </div>
          </button>
          <button
            type="button"
            onClick={() =>
              setShowCalculator(current => !current)
            }
            aria-label="Toggle plate calculator"
            style={{ marginLeft: '8px' }}
          >
            Plates
          </button>
        </div>
      )}
      {showCalculator && (
        <PlateCalculatorPanel
          workWeight={workWeight}
          unit={unit}
          preferredBarTypeId={preferredBarTypeId}
          equipmentInventory={equipmentInventory}
          onClose={() => setShowCalculator(false)}
        />
      )}
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

interface PlateCalculatorPanelProps {
  workWeight: number | null
  unit: 'kg' | 'lb'
  preferredBarTypeId: string
  equipmentInventory: EquipmentInventory
  onClose: () => void
}

function PlateCalculatorPanel({
  workWeight,
  unit,
  preferredBarTypeId,
  equipmentInventory,
  onClose,
}: PlateCalculatorPanelProps) {
  const inventoryBar =
    equipmentInventory.bars.find(
      bar => bar.id === preferredBarTypeId
    ) ?? null
  const fallbackBar = getBarType(preferredBarTypeId)
  const barName =
    inventoryBar?.name ?? fallbackBar?.name ?? 'Barbell'
  const barWeight =
    inventoryBar?.weight ??
    fallbackBar?.weight ??
    20
  const calculation =
    workWeight != null
      ? calculateInventoryPlateStack({
          targetWeight: workWeight,
          barWeight,
          plates: equipmentInventory.plates,
          unit,
        })
      : null

  return (
    <div
      role="dialog"
      aria-label="Plate calculator"
      style={{
        border: '1px solid #d4d4d4',
        padding: '10px',
        marginBottom: '12px',
      }}
    >
      <div>
        <strong>Plate calculator</strong>
      </div>
      <div>
        Bar: {barName} ({barWeight} {unit})
      </div>
      {workWeight == null ? (
        <div>No work weight set.</div>
      ) : (
        <div>
          <div>
            Target: {workWeight} {unit}
          </div>
          <div>
            Achieved: {calculation?.stack.totalWeight} {unit}
          </div>
          {calculation && calculation.rounded && (
            <div role="alert">
              Target weight cannot be loaded exactly with your
              available plates.
              <div>
                Difference: {Math.abs(calculation.delta)} {unit}
              </div>
            </div>
          )}
          <div>Plates per side:</div>
          {calculation?.stack.platesPerSide.length ? (
            <ul>
              {calculation.stack.platesPerSide.map(plate => (
                <li key={plate.weight}>
                  {plate.count} × {plate.weight} {unit}
                </li>
              ))}
            </ul>
          ) : (
            <div>None</div>
          )}
        </div>
      )}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  )
}
