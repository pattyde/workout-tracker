import type { ProgressionState } from '../models/ProgressionState'
import type { Set } from '../models/Set'

/**
 * Result of evaluating a workout for progression purposes.
 */
export interface ProgressionResult {
  /** Updated weight to use for the next workout */
  nextWeight: number

  /** Updated failure streak */
  nextFailureStreak: number

  /** Updated consecutive-success streak toward the next increment */
  nextSuccessStreak: number

  /** Whether the workout was considered a success */
  success: boolean

  /** Whether a deload occurred */
  deloaded: boolean
}
/**
 * Determines whether a workout was successful.
 * A workout is successful if all work sets meet or exceed target reps.
 */
export function isWorkoutSuccessful(sets: Set[]): boolean {
    const workSets = sets.filter(set => set.type === 'work')

    if (workSets.length === 0) {
      return false
    }

    return workSets.every(set => {
      if (set.status !== 'completed') return false
      if (set.actualReps == null) return false
      return set.actualReps >= set.targetReps
    })
  }
/**
 * Calculates the next progression state for an exercise after a workout.
 */
export function calculateNextProgression(
    progression: ProgressionState,
    sets: Set[],
    barWeight: number
  ): ProgressionResult {
    const success = isWorkoutSuccessful(sets)
    const successesRequired = progression.successesRequired ?? 1

    let nextWeight = progression.currentWeight
    let nextFailureStreak = progression.failureStreak
    let nextSuccessStreak = progression.successStreak ?? 0
    let deloaded = false

    if (success) {
      nextSuccessStreak += 1
      nextFailureStreak = 0

      if (nextSuccessStreak >= successesRequired) {
        nextWeight += progression.plateIncrement
        nextSuccessStreak = 0
      }
    } else {
      nextSuccessStreak = 0
      nextFailureStreak += 1

      if (nextFailureStreak >= 3) {
        nextWeight = Math.floor(
          (nextWeight * 0.9) / progression.plateIncrement
        ) * progression.plateIncrement

        nextWeight = Math.max(nextWeight, barWeight)
        nextFailureStreak = 0
        deloaded = true
      }
    }

    return {
      nextWeight,
      nextFailureStreak,
      nextSuccessStreak,
      success,
      deloaded,
    }
  }
