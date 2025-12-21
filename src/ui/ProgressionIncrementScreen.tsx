import { useEffect, useState } from 'react'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import { updateProgressionIncrement } from '../services/progressionIncrementService'

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
      {progressions.map(progression => {
        const definition =
          exerciseDefinitions[progression.exerciseDefinitionId]
        const name = definition?.name ?? 'Unknown Exercise'
        const unit = definition?.defaultUnit ?? 'kg'
        const draft =
          drafts[progression.exerciseDefinitionId] ?? ''

        return (
          <div key={progression.exerciseDefinitionId}>
            <div>{name}</div>
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
