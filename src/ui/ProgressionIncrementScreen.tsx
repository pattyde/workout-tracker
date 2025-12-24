import { useEffect, useRef, useState } from 'react'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type {
  EquipmentInventory,
  EquipmentInventoryPlate,
} from '../domain/models/AppState'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import { listBarTypes } from '../domain/bars/barTypes'
import { updateProgressionIncrement } from '../services/progressionIncrementService'
import { updatePreferredBarType } from '../services/preferredBarService'
import { getOrInitAppState } from '../services/appStateService'
import { updateEquipmentInventory } from '../services/equipmentInventoryService'
import Button from './Button'

interface ProgressionIncrementScreenProps {
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStateRepository: ProgressionStateRepository
  appStateRepository: AppStateRepository
  onBack: () => void
  onSaveSuccess?: (progressions: ProgressionState[]) => void
}

export default function ProgressionIncrementScreen({
  exerciseDefinitions,
  progressionStateRepository,
  appStateRepository,
  onBack,
  onSaveSuccess,
}: ProgressionIncrementScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressions, setProgressions] = useState<
    ProgressionState[]
  >([])
  const [drafts, setDrafts] = useState<Record<string, string>>(
    {}
  )
  const [barDrafts, setBarDrafts] = useState<
    Record<string, string>
  >({})
  const [equipmentInventory, setEquipmentInventory] =
    useState<EquipmentInventory | null>(null)
  const [equipmentBarDrafts, setEquipmentBarDrafts] =
    useState<Record<string, boolean>>({})
  const [equipmentPlateDrafts, setEquipmentPlateDrafts] =
    useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] =
    useState(false)
  const saveTimerRef = useRef<number | null>(null)

  function getPlateKey(plate: EquipmentInventoryPlate) {
    return `${plate.weight}-${plate.unit}`
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const all =
          await progressionStateRepository.listAll()
        const appState = await getOrInitAppState(
          appStateRepository
        )
        if (!cancelled) {
          setProgressions(all)
          const nextDrafts: Record<string, string> = {}
          for (const progression of all) {
            nextDrafts[progression.exerciseDefinitionId] =
              String(progression.plateIncrement)
          }
          setDrafts(nextDrafts)
          const nextBars: Record<string, string> = {}
          for (const progression of all) {
            nextBars[progression.exerciseDefinitionId] =
              progression.preferredBarTypeId ??
              'olympic-20kg'
          }
          setBarDrafts(nextBars)
          const inventory = appState.equipmentInventory
          if (inventory) {
            setEquipmentInventory(inventory)
            const barMap: Record<string, boolean> = {}
            for (const bar of inventory.bars) {
              barMap[bar.id] = bar.enabled
            }
            setEquipmentBarDrafts(barMap)
            const plateMap: Record<string, string> = {}
            for (const plate of inventory.plates) {
              plateMap[getPlateKey(plate)] = String(
                plate.quantity
              )
            }
            setEquipmentPlateDrafts(plateMap)
          }
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
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [progressionStateRepository, appStateRepository])

  if (loading) {
    return <div>Loading increments...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
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
          Settings
        </div>
      </div>
      {progressions.map(progression => {
        const definition =
          exerciseDefinitions[progression.exerciseDefinitionId]
        const name = definition?.name ?? 'Unknown Exercise'
        const unit = definition?.defaultUnit ?? 'kg'
        const draft =
          drafts[progression.exerciseDefinitionId] ?? ''
        const barDraft =
          barDrafts[progression.exerciseDefinitionId] ??
          'olympic-20kg'

        return (
          <div
            key={progression.exerciseDefinitionId}
            style={{
              border: '1px solid #d6d6d6',
              borderRadius: '12px',
              padding: '16px',
              background: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              {name}
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#555' }}>
                Preferred bar
              </span>
              <div style={{ position: 'relative' }}>
                <select
                  value={barDraft}
                  onChange={event => {
                    const selected = event.target.value
                    setBarDrafts(current => ({
                      ...current,
                      [progression.exerciseDefinitionId]: selected,
                    }))
                  }}
                  style={{
                    minHeight: '48px',
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  {listBarTypes().map(bar => (
                    <option key={bar.id} value={bar.id}>
                      {bar.name} ({bar.weight} {bar.unit})
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#6b7280',
                    fontSize: '0.9rem',
                  }}
                >
                  ▾
                </span>
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#555' }}>
                Progression increment
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={draft}
                  onChange={event =>
                    setDrafts(current => ({
                      ...current,
                      [progression.exerciseDefinitionId]:
                        event.target.value,
                    }))
                  }
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    minHeight: '48px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                  }}
                />
                <span style={{ color: '#666', fontSize: '0.95rem' }}>
                  {unit}
                </span>
              </div>
            </label>
          </div>
        )
      })}
      <div
        style={{
          border: '1px solid #d6d6d6',
          borderRadius: '12px',
          padding: '16px',
          background: '#f9f9f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h3 style={{ margin: 0 }}>Equipment</h3>
      {!equipmentInventory && (
        <div>Loading equipment...</div>
      )}
      {equipmentInventory && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>
            Bars
          </div>
          {equipmentInventory.bars.map(bar => {
            const enabled = equipmentBarDrafts[bar.id] ?? false
            return (
              <label
                key={bar.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  marginTop: '6px',
                  minHeight: '48px',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{bar.name}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    {bar.weight} {bar.unit}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={event => {
                    const checked = event.target.checked
                    setEquipmentBarDrafts(current => ({
                      ...current,
                      [bar.id]: checked,
                    }))
                  }}
                  aria-label={`${bar.name} ${bar.weight} ${bar.unit}`}
                  style={{
                    width: '20px',
                    height: '20px',
                  }}
                />
              </label>
            )
          })}
          <div style={{ fontWeight: 600, marginTop: '12px' }}>
            Plates
          </div>
          {equipmentInventory.plates.map(plate => {
            const key = getPlateKey(plate)
            const draft = equipmentPlateDrafts[key] ?? '0'
            const quantity = Math.max(0, Number(draft) || 0)
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  marginTop: '6px',
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {plate.weight} {plate.unit}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Decrease ${plate.weight} ${plate.unit} plates`}
                    onClick={() => {
                      const next = Math.max(0, quantity - 1)
                      setEquipmentPlateDrafts(current => ({
                        ...current,
                        [key]: String(next),
                      }))
                    }}
                    style={{
                      minWidth: '40px',
                      minHeight: '40px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#f3f4f6',
                      fontSize: '1.1rem',
                    }}
                  >
                    −
                  </button>
                  <div
                    style={{
                      minWidth: '24px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                    aria-label={`Quantity ${quantity}`}
                  >
                    {quantity}
                  </div>
                  <button
                    type="button"
                    aria-label={`Increase ${plate.weight} ${plate.unit} plates`}
                    onClick={() => {
                      const next = quantity + 1
                      setEquipmentPlateDrafts(current => ({
                        ...current,
                        [key]: String(next),
                      }))
                    }}
                    style={{
                      minWidth: '40px',
                      minHeight: '40px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#f3f4f6',
                      fontSize: '1.1rem',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
      <Button
        variant="primary"
        onClick={async () => {
          setSaving(true)
          setError(null)
          try {
            for (const progression of progressions) {
              const incrementRaw =
                drafts[progression.exerciseDefinitionId] ?? ''
              const increment = Number(incrementRaw)
              await updateProgressionIncrement(
                progression.exerciseDefinitionId,
                increment,
                progressionStateRepository
              )
              const barId =
                barDrafts[progression.exerciseDefinitionId] ??
                'olympic-20kg'
              await updatePreferredBarType(
                progression.exerciseDefinitionId,
                barId,
                progressionStateRepository
              )
            }

            if (equipmentInventory) {
              const updatedPlates =
                equipmentInventory.plates.map(plate => {
                  const key = getPlateKey(plate)
                  const raw =
                    equipmentPlateDrafts[key] ?? '0'
                  const quantity = Number(raw)
                  if (
                    !Number.isFinite(quantity) ||
                    quantity < 0
                  ) {
                    throw new Error(
                      'Plate quantities must be zero or greater'
                    )
                  }
                  return {
                    ...plate,
                    quantity,
                  }
                })
              const updatedBars =
                equipmentInventory.bars.map(bar => ({
                  ...bar,
                  enabled: equipmentBarDrafts[bar.id] ?? false,
                }))
              const updatedInventory: EquipmentInventory = {
                bars: updatedBars,
                plates: updatedPlates,
              }
              const updatedAppState =
                await updateEquipmentInventory(
                  updatedInventory,
                  appStateRepository
                )
              setEquipmentInventory(
                updatedAppState.equipmentInventory ??
                  updatedInventory
              )
            }

            const refreshed =
              await progressionStateRepository.listAll()
            setProgressions(refreshed)
            onSaveSuccess?.(refreshed)
            setShowSaveConfirmation(true)
            if (saveTimerRef.current != null) {
              window.clearTimeout(saveTimerRef.current)
            }
            saveTimerRef.current = window.setTimeout(() => {
              setShowSaveConfirmation(false)
              saveTimerRef.current = null
            }, 2000)
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Unknown error'
            setError(message)
          } finally {
            setSaving(false)
          }
        }}
        style={{ width: '100%', minHeight: '52px' }}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {showSaveConfirmation && !saving && (
        <div style={{ color: '#166534', fontSize: '0.9rem' }}>
          Settings saved
        </div>
      )}
    </div>
  )
}
