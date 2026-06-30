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
  const parts = timeStr.split(':').map(Number)
  const h = parts[0] ?? NaN
  const m = parts[1] ?? NaN
  if (isNaN(h) || isNaN(m)) return dateMs
  const d = new Date(dateMs)
  d.setUTCHours(h, m, 0, 0)
  return d.getTime()
}

function parseDateToMs(dateStr: string): number {
  // yyyy/mm/dd
  const parts = dateStr.split('/').map(Number)
  const y = parts[0] ?? 0
  const mo = parts[1] ?? 1
  const d = parts[2] ?? 1
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

export function parseWorkoutHistoryCSV(csvText: string): ImportResult {
  // Strip UTF-8 BOM if present
  const text = csvText.replace(/^﻿/, '')
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)

  const headers = parseCSVLine(lines[0] ?? '').map(h => h.trim())

  if (headers.includes('Date (yyyy/mm/dd)')) {
    return parseStrongLiftsFormat(lines, headers)
  }
  if (headers.includes('date') && headers.includes('variation')) {
    return parseNativeFormat(lines, headers)
  }
  throw new Error(
    'Unrecognised CSV format. Please use a file exported from this app or from StrongLifts.'
  )
}

function parseStrongLiftsFormat(lines: string[], headers: string[]): ImportResult {
  function col(row: string[], name: string): string {
    const idx = headers.indexOf(name)
    return idx >= 0 ? (row[idx] ?? '').replace(/^"|"$/g, '').trim() : ''
  }

  // Group rows by (Date, Workout number) — that identifies a single session
  const sessionMap = new Map<string, string[][]>()

  const skippedSet = new Set<string>()
  let exerciseRowCount = 0

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i] ?? '')
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
    const firstRow = rows[0] ?? []
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
      const exerciseDefinitionId = EXERCISE_NAME_MAP[col(row, 'Exercise')] ?? ''

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

// Native app CSV format: date,variation,exercise,set_index,target_reps,actual_reps,weight_kg,status
function parseNativeFormat(lines: string[], headers: string[]): ImportResult {
  function col(row: string[], name: string): string {
    const idx = headers.indexOf(name)
    return idx >= 0 ? (row[idx] ?? '').replace(/^"|"$/g, '').trim() : ''
  }

  // Group rows by (date, variation) then by exercise name
  const sessionMap = new Map<string, Map<string, string[][]>>()

  const skippedSet = new Set<string>()
  let exerciseRowCount = 0

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i] ?? '')
    const date = col(row, 'date')
    const variation = col(row, 'variation')
    if (!date || !variation) continue

    const exerciseName = col(row, 'exercise')
    if (!EXERCISE_NAME_MAP[exerciseName]) {
      skippedSet.add(exerciseName)
      continue
    }

    exerciseRowCount++
    const sessionKey = `${date}__${variation}`
    if (!sessionMap.has(sessionKey)) sessionMap.set(sessionKey, new Map())
    const exerciseMap = sessionMap.get(sessionKey)!
    if (!exerciseMap.has(exerciseName)) exerciseMap.set(exerciseName, [])
    exerciseMap.get(exerciseName)!.push(row)
  }

  const workouts: Workout[] = []

  for (const [sessionKey, exerciseMap] of sessionMap) {
    const [dateStr = '', variation = 'A'] = sessionKey.split('__')
    // Native date is yyyy-mm-dd (ISO)
    const dateMs = new Date(dateStr).getTime()
    const workoutId = crypto.randomUUID()

    const exerciseInstances: ExerciseInstance[] = []
    let orderIndex = 0

    for (const [exerciseName, rows] of exerciseMap) {
      const exerciseDefinitionId = EXERCISE_NAME_MAP[exerciseName] ?? ''
      const sets: Set[] = rows.map(row => {
        const actualRepsRaw = col(row, 'actual_reps')
        const rawStatus = col(row, 'status')
        const status: Set['status'] =
          rawStatus === 'completed' || rawStatus === 'failed' || rawStatus === 'pending'
            ? rawStatus
            : 'completed'
        return {
          id: crypto.randomUUID(),
          orderIndex: Number(col(row, 'set_index')) - 1,
          type: 'work' as const,
          enabled: true,
          targetWeight: Number(col(row, 'weight_kg')),
          targetReps: Number(col(row, 'target_reps')),
          actualWeight: Number(col(row, 'weight_kg')),
          actualReps: actualRepsRaw !== '' ? Number(actualRepsRaw) : undefined,
          status,
        }
      })
      sets.sort((a, b) => a.orderIndex - b.orderIndex)

      const workWeight = sets[0]?.targetWeight ?? 0

      exerciseInstances.push({
        id: crypto.randomUUID(),
        exerciseDefinitionId,
        workoutId,
        orderIndex,
        sets,
        workWeight,
        barTypeId: 'olympic-20kg',
        useSharedBarLoading: false,
      })
      orderIndex++
    }

    workouts.push({
      id: workoutId,
      dateMs,
      variation: variation as 'A' | 'B',
      completed: true,
      deleted: false,
      completedAtMs: dateMs,
      exerciseInstances,
    })
  }

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
        successStreak: result.nextSuccessStreak,
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
