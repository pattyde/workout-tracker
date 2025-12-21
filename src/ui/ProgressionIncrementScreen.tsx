import { useEffect, useState } from 'react'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import {
  getBarType,
  listBarTypes,
} from '../domain/bars/barTypes'
import { updateProgressionIncrement } from '../services/progressionIncrementService'
import { updatePreferredBarType } from '../services/preferredBarService'

interface ProgressionIncrementScreenProps {
  exerciseDefinitions: Record<string, ExerciseDefinition>
  progressionStateRepository: ProgressionStateRepository
  onBack: () => void
}

export default function ProgressionIncrementScreen({
  exerciseDefinitions,
  progressionStateRepository,
  onBack,
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
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const all =
          await progressionStateRepository.listAll()
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
  }, [progressionStateRepository])

  if (loading) {
    return <div>Loading increments...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <button type="button" onClick={onBack}>
        Back
      </button>
      <h2>Progression Increments</h2>
      <h3>Exercise Settings</h3>
      {progressions.map(progression => {
        const definition =
          exerciseDefinitions[progression.exerciseDefinitionId]
        const name = definition?.name ?? 'Unknown Exercise'
        const unit = definition?.defaultUnit ?? 'kg'
        const draft =
          drafts[progression.exerciseDefinitionId] ?? ''
        const preferredBar =
          getBarType(
            progression.preferredBarTypeId ??
              'olympic-20kg'
          ) ?? getBarType('olympic-20kg')
        const barDraft =
          barDrafts[progression.exerciseDefinitionId] ??
          'olympic-20kg'

        return (
          <div key={progression.exerciseDefinitionId}>
            <div>{name}</div>
            <div>
              <label>
                Preferred bar
                <div>
                  <select
                    value={barDraft}
                    onChange={event => {
                      const selected = event.target.value
                      setBarDrafts(current => ({
                        ...current,
                        [progression.exerciseDefinitionId]:
                          selected,
                      }))
                    }}
                  >
                    {listBarTypes().map(bar => (
                      <option key={bar.id} value={bar.id}>
                        {bar.name} ({bar.weight} {bar.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <div>
                Current: {preferredBar?.name ?? 'Olympic bar'} (
                {preferredBar?.weight ?? 20}{' '}
                {preferredBar?.unit ?? 'kg'})
              </div>
              <button
                type="button"
                onClick={async () => {
                  const selected = barDraft
                  setSaving(progression.exerciseDefinitionId)
                  setError(null)
                  try {
                    const updated =
                      await updatePreferredBarType(
                        progression.exerciseDefinitionId,
                        selected,
                        progressionStateRepository
                      )
                    setProgressions(current =>
                      current.map(item =>
                        item.exerciseDefinitionId ===
                        updated.exerciseDefinitionId
                          ? updated
                          : item
                      )
                    )
                  } catch (err) {
                    const message =
                      err instanceof Error
                        ? err.message
                        : 'Unknown error'
                    setError(message)
                  } finally {
                    setSaving(null)
                  }
                }}
                disabled={
                  saving === progression.exerciseDefinitionId
                }
              >
                {saving === progression.exerciseDefinitionId
                  ? 'Saving...'
                  : 'Save bar'}
              </button>
            </div>
            <label>
              Increment
              <div>
                <input
                  type="number"
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
                />{' '}
                {unit}
              </div>
            </label>
            <button
              type="button"
              onClick={async () => {
                const value = Number(draft)
                setSaving(progression.exerciseDefinitionId)
                setError(null)
                try {
                  const updated =
                    await updateProgressionIncrement(
                      progression.exerciseDefinitionId,
                      value,
                      progressionStateRepository
                    )
                  setProgressions(current =>
                    current.map(item =>
                      item.exerciseDefinitionId ===
                      updated.exerciseDefinitionId
                        ? updated
                        : item
                    )
                  )
                } catch (err) {
                  const message =
                    err instanceof Error
                      ? err.message
                      : 'Unknown error'
                  setError(message)
                } finally {
                  setSaving(null)
                }
              }}
              disabled={
                saving === progression.exerciseDefinitionId
              }
            >
              {saving === progression.exerciseDefinitionId
                ? 'Saving...'
                : 'Save'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
