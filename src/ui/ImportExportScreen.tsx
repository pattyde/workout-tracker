import { useRef, useState } from 'react'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { ProgressionState } from '../domain/models/ProgressionState'
import type { Workout } from '../domain/models/Workout'
import {
  parseStrongLiftsCSV,
  exportWorkoutsToCSV,
  deriveProgressionUpdatesFromWorkouts,
  type ImportPreview,
} from '../services/importExportService'
import Button from './Button'

interface ImportExportScreenProps {
  workoutRepository: WorkoutRepository
  progressionStateRepository: ProgressionStateRepository
  progressionStates: Record<string, ProgressionState>
  exerciseDefinitions: Record<string, ExerciseDefinition>
  onBack: () => void
}

export default function ImportExportScreen({
  workoutRepository,
  progressionStateRepository,
  progressionStates,
  exerciseDefinitions,
  onBack,
}: ImportExportScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [pendingWorkouts, setPendingWorkouts] = useState<Workout[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [exporting, setExporting] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setPreview(null)
    setPendingWorkouts([])
    setImportDone(false)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const result = parseStrongLiftsCSV(text)
        setPreview(result.preview)
        setPendingWorkouts(result.workouts)
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : 'Failed to parse CSV'
        )
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (pendingWorkouts.length === 0) return
    setImporting(true)
    try {
      for (const workout of pendingWorkouts) {
        await workoutRepository.save(workout)
      }
      const progressionUpdates = deriveProgressionUpdatesFromWorkouts(
        pendingWorkouts,
        progressionStates
      )
      for (const update of progressionUpdates) {
        await progressionStateRepository.save(update)
      }
      setImportDone(true)
      setPreview(null)
      setPendingWorkouts([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Import failed'
      )
    } finally {
      setImporting(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const all = await workoutRepository.listAll()
      const csv = exportWorkoutsToCSV(all, exerciseDefinitions)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `5x5-history-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px 4px 0',
            color: '#2563eb',
          }}
        >
          ‹ Back
        </button>
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Import / Export
        </span>
        <span style={{ width: '60px' }} />
      </div>

      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* Export section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Export History</h2>
          <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
            Download your workout history as a CSV file.
          </p>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={exporting}
            style={{ width: '100%', minHeight: '48px' }}
          >
            {exporting ? 'Exporting...' : 'Export History'}
          </Button>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />

        {/* Import section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Import from StrongLifts</h2>
          <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
            Import workout history from a StrongLifts CSV export.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ fontSize: '0.9rem' }}
          />

          {parseError && (
            <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>
              {parseError}
            </div>
          )}

          {preview && (
            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.9rem',
              }}
            >
              <div>
                <strong>{preview.workoutCount}</strong> workouts found
              </div>
              <div>
                <strong>{preview.exerciseRowCount}</strong> exercise sessions
              </div>
              {preview.skippedExercises.length > 0 && (
                <div style={{ color: '#92400e' }}>
                  Skipped unknown exercises:{' '}
                  {preview.skippedExercises.join(', ')}
                </div>
              )}
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing}
                style={{ width: '100%', minHeight: '48px', marginTop: '8px' }}
              >
                {importing
                  ? 'Importing...'
                  : `Import ${preview.workoutCount} Workouts`}
              </Button>
            </div>
          )}

          {importDone && (
            <div style={{ color: '#16a34a', fontSize: '0.9rem', fontWeight: 500 }}>
              Import complete. View your history to see the results.
            </div>
          )}
        </section>
      </div>
    </>
  )
}
