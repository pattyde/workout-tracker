import { useEffect, useState } from 'react'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { Workout } from '../domain/models/Workout'
import { getBarType } from '../domain/bars/barTypes'
import { calculateInventoryPlateStack } from '../domain/calculations/inventoryPlateCalculator'
import { getExerciseWorkWeight } from '../domain/exercises/workWeight'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { EquipmentInventory } from '../domain/models/AppState'
import Button from './Button'

interface ActiveWorkoutViewProps {
  workout: Workout
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStates: Record<string, ProgressionState>
  equipmentInventory: EquipmentInventory
  onVariationChange: (variation: Workout['variation']) => void
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
  onVariationChange,
  onSetTap,
  onWorkWeightSave,
}: ActiveWorkoutViewProps) {
  const orderedExercises = [...workout.exerciseInstances].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

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
      <div>
        <h1 style={{ margin: 0 }}>Workout Tracker</h1>
        <VariationHeader
          currentVariation={workout.variation}
          onConfirmChange={onVariationChange}
        />
      </div>
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
    <div
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
        <div>
          <h3 style={{ margin: 0 }}>{exerciseDefinitionName}</h3>
        </div>
        {isEditingWeight ? null : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsEditingWeight(true)}
              aria-label="Edit work weight"
              style={{
                padding: '8px 12px',
                border: '1px solid #c9c9c9',
                borderRadius: '10px',
                background: '#ffffff',
                minHeight: '44px',
              }}
            >
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
              style={{
                marginLeft: '8px',
                minHeight: '44px',
                padding: '8px 12px',
              }}
            >
              Plates
            </button>
          </div>
        )}
      </div>
      {isEditingWeight ? (
        <div
          style={{
            padding: '10px',
            border: '1px solid #c9c9c9',
            borderRadius: '10px',
            background: '#ffffff',
            marginBottom: '12px',
          }}
        >
          <label>
            Work weight
            <div>
              <input
                type="number"
                inputMode="decimal"
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
        <div />
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
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'nowrap',
        }}
      >
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
  const isPending = status === 'pending'

  return (
    <button
      type="button"
      onClick={onTap}
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
      aria-label={`Set ${index + 1}`}
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

interface VariationHeaderProps {
  currentVariation: Workout['variation']
  onConfirmChange: (variation: Workout['variation']) => void
}

function VariationHeader({
  currentVariation,
  onConfirmChange,
}: VariationHeaderProps) {
  const [isChanging, setIsChanging] = useState(false)
  const [selected, setSelected] =
    useState<Workout['variation']>(currentVariation)

  useEffect(() => {
    if (!isChanging) {
      setSelected(currentVariation)
    }
  }, [currentVariation, isChanging])

  return (
    <div>
      <h2>Variation {currentVariation}</h2>
      <Button variant="secondary" onClick={() => setIsChanging(true)}>
        Change variation
      </Button>
      {isChanging && (
        <div
          style={{
            border: '1px solid #d4d4d4',
            padding: '10px',
            marginBottom: '12px',
          }}
        >
          <div>
            <strong>Switch variation</strong>
          </div>
          <label>
            <input
              type="radio"
              name="variation"
              value="A"
              checked={selected === 'A'}
              onChange={() => setSelected('A')}
            />{' '}
            Variation A
          </label>
          <label>
            <input
              type="radio"
              name="variation"
              value="B"
              checked={selected === 'B'}
              onChange={() => setSelected('B')}
            />{' '}
            Variation B
          </label>
          <div>
            This will replace the current workout exercises.
          </div>
          <button
            type="button"
            onClick={() => {
              onConfirmChange(selected)
              setIsChanging(false)
            }}
          >
            Confirm switch
          </button>
          <button
            type="button"
            onClick={() => setIsChanging(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
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

  const plateStacks = calculation?.stack.platesPerSide ?? []
  const perSideSummary = plateStacks
    .map(plate => `${plate.weight} × ${plate.count}`)
    .join(', ')
  const hasPlates = plateStacks.length > 0

  function getPlateWidth(weight: number): number {
    const maxWeight =
      plateStacks[0]?.weight ?? weight
    if (maxWeight <= 0) return 48
    const scale = weight / maxWeight
    return Math.max(26, Math.round(68 * scale))
  }

  function getPlateColor(weight: number): string {
    if (weight >= 20) return '#4b5563'
    if (weight >= 15) return '#6b7280'
    if (weight >= 10) return '#7f8896'
    if (weight >= 5) return '#9aa1ac'
    return '#b3bac5'
  }

  return (
    <div
      role="dialog"
      aria-label="Plate calculator"
      style={{
        border: '1px solid #d4d4d4',
        padding: '10px',
        marginBottom: '12px',
        borderRadius: '10px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ fontWeight: 700 }}>Plate Calculator</div>
      <div style={{ fontSize: '0.9rem', color: '#555' }}>
        {barName} ({barWeight} {unit})
      </div>
      {workWeight == null ? (
        <div>No work weight set.</div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '0.9rem',
              color: '#444',
            }}
          >
            <div>
              Target: {workWeight} {unit}
            </div>
            <div>
              Achieved: {calculation?.stack.totalWeight} {unit}
            </div>
          </div>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '8px',
              background: '#f9fafb',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minHeight: '52px',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: '40px',
                  height: '12px',
                  borderRadius: '6px',
                  background: '#6b7280',
                }}
              />
              {hasPlates ? (
                plateStacks.map(plate => {
                  const width = getPlateWidth(plate.weight)
                  return (
                    <div
                      key={plate.weight}
                      style={{
                        display: 'flex',
                        gap: '3px',
                      }}
                    >
                      {Array.from({ length: plate.count }).map(
                        (_, idx) => (
                          <div
                            key={`${plate.weight}-${idx}`}
                            style={{
                              width: `${width}px`,
                              height: '40px',
                              borderRadius: '6px',
                              background: getPlateColor(
                                plate.weight
                              ),
                              color: '#f9fafb',
                              fontSize: '0.7rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {plate.weight}
                          </div>
                        )
                      )}
                    </div>
                  )
                })
              ) : (
                <div style={{ color: '#6b7280' }}>
                  Bar only
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '0.8rem',
                color: '#6b7280',
              }}
            >
              Diagram shows one side only
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Per side:{' '}
            {perSideSummary.length > 0
              ? perSideSummary.replace(/, /g, ' · ')
              : `None`}
          </div>
          {calculation && calculation.rounded && (
            <div role="alert" style={{ color: '#7c2d12' }}>
              Target weight cannot be loaded exactly with your
              available plates. Difference:{' '}
              {Math.abs(calculation.delta)} {unit}
            </div>
          )}
        </>
      )}
      <Button
        variant="secondary"
        onClick={onClose}
        style={{ width: '100%' }}
      >
        Close
      </Button>
    </div>
  )
}
