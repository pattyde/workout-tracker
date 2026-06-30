import type { Workout } from '../domain/models/Workout'
import type { ExerciseInstance } from '../domain/models/ExerciseInstance'
import type { Set } from '../domain/models/Set'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { ProgressionState } from '../domain/models/ProgressionState'
import { calculateNextProgression } from '../domain/progression/progressionLogic'
import { getBarWeight } from '../domain/bars/barTypes'

const EXERCISE_NAME_MAP: Record<string, string> = {
  Squat: 'squat',
  'Bench Press': 'bench-press',
  'Barbell Row': 'barbell-row',
  'Overhead Press': 'overhead-press',
  Deadlift: 'deadlift',
}

function parseTimeToMs(dateMs: number, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return dateMs
  const d = new Date(dateMs)
  d.setUTCHours(h, m, 0, 0)
  return d.getTime()
}

function parseDateToMs(dateStr: string): number {
  // yyyy/mm/dd
  const [y, mo, d] = dateStr.split('/').map(Number)
  return Date.UTC(y, mo - 1, d)
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

export interface ImportPreview {
  workoutCount: number
  exerciseRowCount: number
  skippedExercises: string[]
}

export interface ImportResult {
  workouts: Workout[]
  preview: ImportPreview
}

export function parseStrongLiftsCSV(csvText: string): ImportResult {
  // Strip UTF-8 BOM if present
  const text = csvText.replace(/^﻿/, '')
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)

  const headers = parseCSVLine(lines[0]).map(h => h.trim())

  function col(row: string[], name: string): string {
    const idx = headers.indexOf(name)
    return idx >= 0 ? (row[idx] ?? '').replace(/^"|"$/g, '').trim() : ''
  }

  // Group rows by (Date, Workout number) — that identifies a single session
  const sessionMap = new Map<string, string[][]>()

  const skippedSet = new Set<string>()
  let exerciseRowCount = 0

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    const date = col(row, 'Date (yyyy/mm/dd)')
    const workoutNum = col(row, 'Workout')
    if (!date || !workoutNum) continue

    const exerciseName = col(row, 'Exercise')
    if (!EXERCISE_NAME_MAP[exerciseName]) {
      skippedSet.add(exerciseName)
      continue
    }

    exerciseRowCount++
    const key = `${date}__${workoutNum}`
    if (!sessionMap.has(key)) sessionMap.set(key, [])
    sessionMap.get(key)!.push(row)
  }

  const workouts: Workout[] = []

  for (const [, rows] of sessionMap) {
    const firstRow = rows[0]
    const dateStr = col(firstRow, 'Date (yyyy/mm/dd)')
    const workoutName = col(firstRow, 'Workout Name')
    const startTimeStr = col(firstRow, 'Start Time (h:mm)')
    const endTimeStr = col(firstRow, 'End Time (h:mm)')

    const dateMs = parseDateToMs(dateStr)
    const variation: 'A' | 'B' = workoutName.includes('B') ? 'B' : 'A'

    const startedAtMs = startTimeStr
      ? parseTimeToMs(dateMs, startTimeStr)
      : undefined
    const completedAtMs = endTimeStr
      ? parseTimeToMs(dateMs, endTimeStr)
      : dateMs

    const workoutId = crypto.randomUUID()

    const exerciseInstances: ExerciseInstance[] = rows.map((row, orderIndex) => {
      const exerciseId = crypto.randomUUID()
      const exerciseDefinitionId = EXERCISE_NAME_MAP[col(row, 'Exercise')]

      const sets: Set[] = []
      let workWeight = 0

      for (let s = 1; s <= 5; s++) {
        const repsStr = col(row, `Set ${s} (Reps)`)
        const kgStr = col(row, `Set ${s} (KG)`)

        if (kgStr === '' && repsStr === '') break

        const kg = parseFloat(kgStr) || 0
        const reps = parseInt(repsStr, 10)
        const actualReps = isNaN(reps) ? 0 : reps

        if (s === 1) workWeight = kg

        sets.push({
          id: crypto.randomUUID(),
          orderIndex: s - 1,
          type: 'work',
          enabled: true,
          targetWeight: kg,
          targetReps: 5,
          actualWeight: kg,
          actualReps,
          status: actualReps > 0 ? 'completed' : 'failed',
        })
      }

      return {
        id: exerciseId,
        exerciseDefinitionId,
        workoutId,
        orderIndex,
        sets,
        workWeight,
        barTypeId: 'olympic-20kg',
        useSharedBarLoading: false,
      }
    })

    workouts.push({
      id: workoutId,
      dateMs,
      variation,
      completed: true,
      deleted: false,
      startedAtMs,
      completedAtMs,
      exerciseInstances,
    })
  }

  // Sort ascending by date
  workouts.sort((a, b) => a.dateMs - b.dateMs)

  return {
    workouts,
    preview: {
      workoutCount: workouts.length,
      exerciseRowCount,
      skippedExercises: [...skippedSet],
    },
  }
}

export function deriveProgressionUpdatesFromWorkouts(
  workouts: Workout[],
  currentProgressionStates: Record<string, ProgressionState>
): ProgressionState[] {
  const stateMap: Record<string, ProgressionState> = {}
  for (const [id, state] of Object.entries(currentProgressionStates)) {
    stateMap[id] = { ...state }
  }

  const sorted = [...workouts].sort((a, b) => a.dateMs - b.dateMs)

  for (const workout of sorted) {
    for (const instance of workout.exerciseInstances) {
      const state = stateMap[instance.exerciseDefinitionId]
      if (!state) continue

      const barWeight = getBarWeight(instance.barTypeId)
      const result = calculateNextProgression(
        { ...state, currentWeight: instance.workWeight },
        instance.sets,
        barWeight
      )

      stateMap[instance.exerciseDefinitionId] = {
        ...state,
        currentWeight: result.nextWeight,
        failureStreak: result.nextFailureStreak,
      }
    }
  }

  return Object.values(stateMap)
}

export function exportWorkoutsToCSV(
  workouts: Workout[],
  definitions: Record<string, ExerciseDefinition>
): string {
  const rows: string[] = [
    'date,variation,exercise,set_index,target_reps,actual_reps,weight_kg,status',
  ]

  const sorted = [...workouts].sort((a, b) => a.dateMs - b.dateMs)

  for (const workout of sorted) {
    const date = new Date(workout.dateMs).toISOString().slice(0, 10)
    for (const instance of workout.exerciseInstances) {
      const name = definitions[instance.exerciseDefinitionId]?.name ?? instance.exerciseDefinitionId
      for (const set of instance.sets) {
        if (set.type !== 'work') continue
        rows.push(
          [
            date,
            workout.variation,
            `"${name}"`,
            set.orderIndex + 1,
            set.targetReps,
            set.actualReps ?? '',
            set.actualWeight ?? set.targetWeight,
            set.status,
          ].join(',')
        )
      }
    }
  }

  return rows.join('\n')
}
