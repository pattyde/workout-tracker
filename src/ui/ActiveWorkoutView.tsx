import { useEffect, useRef, useState } from 'react'
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
  onBack: () => void
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
  onBack,
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
      <VariationHeader
        currentVariation={workout.variation}
        onConfirmChange={onVariationChange}
        onBack={onBack}
      />
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const editorId = `work-weight-editor-${exerciseInstanceId}`

  useEffect(() => {
    if (!isEditingWeight) {
      setDraftWeight(
        workWeight != null ? String(workWeight) : ''
      )
    }
  }, [workWeight, isEditingWeight])

  useEffect(() => {
    if (!isEditingWeight) return
    const input = inputRef.current
    if (input) {
      input.focus()
      input.select()
    }
  }, [isEditingWeight])

  useEffect(() => {
    if (!isEditingWeight) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isEditingWeight])

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
            <Button
              variant="secondary"
              onClick={() =>
                setShowCalculator(current => !current)
              }
              aria-label="Toggle plate calculator"
              style={{
                marginLeft: '8px',
                fontWeight: 500,
              }}
            >
              Plates
            </Button>
          </div>
        )}
      </div>
      {isEditingWeight ? (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 30,
            }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={editorId}
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
              <div id={editorId} style={{ fontWeight: 700 }}>
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
                    value={draftWeight}
                    onChange={event =>
                      setDraftWeight(event.target.value)
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
                    {unit}
                  </span>
                </div>
              </label>
              {weightError && <div>{weightError}</div>}
              <Button
                variant="primary"
                onClick={handleSaveWeight}
                style={{ width: '100%', minHeight: '48px' }}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDraftWeight(
                    workWeight != null ? String(workWeight) : ''
                  )
                  setWeightError(null)
                  setIsEditingWeight(false)
                }}
                style={{ width: '100%', minHeight: '48px' }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
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
  onBack: () => void
}

function VariationHeader({
  currentVariation,
  onConfirmChange,
  onBack,
}: VariationHeaderProps) {
  const [isChanging, setIsChanging] = useState(false)
  const [selected, setSelected] =
    useState<Workout['variation']>(currentVariation)
  const panelId = 'variation-switcher-panel'

  useEffect(() => {
    if (!isChanging) {
      setSelected(currentVariation)
    }
  }, [currentVariation, isChanging])

  useEffect(() => {
    if (!isChanging) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isChanging])

  return (
    <div>
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
          Workout {currentVariation}
        </div>
        {!isChanging && (
          <button
            type="button"
            onClick={() => setIsChanging(true)}
            aria-label="Edit workout"
            style={{
              marginLeft: 'auto',
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
      {isChanging && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 20,
            }}
            aria-hidden="true"
            onClick={() => setIsChanging(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={panelId}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 21,
            }}
          >
            <div
              style={{
                border: '1px solid #d4d4d4',
                padding: '12px',
                borderRadius: '12px',
                background: '#f9f9f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '420px',
              }}
            >
              <div id={panelId} style={{ fontWeight: 700 }}>
                Switch workout variation
              </div>
              <div style={{ color: '#555', fontSize: '0.9rem' }}>
                This will replace the exercises in your current
                workout.
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <label
                  style={{
                    border:
                      selected === 'A'
                        ? '2px solid #2563EB'
                        : '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px',
                    background:
                      selected === 'A' ? '#eff6ff' : '#ffffff',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="radio"
                    name="variation"
                    value="A"
                    checked={selected === 'A'}
                    onChange={() => setSelected('A')}
                  />
                  Workout A
                </label>
                <label
                  style={{
                    border:
                      selected === 'B'
                        ? '2px solid #2563EB'
                        : '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px',
                    background:
                      selected === 'B' ? '#eff6ff' : '#ffffff',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="radio"
                    name="variation"
                    value="B"
                    checked={selected === 'B'}
                    onChange={() => setSelected('B')}
                  />
                  Workout B
                </label>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <Button
                  variant="primary"
                  onClick={() => {
                    onConfirmChange(selected)
                    setIsChanging(false)
                  }}
                  style={{ width: '100%' }}
                >
                  Confirm Switch
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsChanging(false)}
                  style={{ width: '100%' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
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
