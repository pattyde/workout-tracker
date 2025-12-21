import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import WorkoutHistoryScreen from './WorkoutHistoryScreen'

class MemoryWorkoutRepository implements WorkoutRepository {
  constructor(private workouts: Workout[]) {}

  async getById(id: string): Promise<Workout | null> {
    return this.workouts.find(workout => workout.id === id) ?? null
  }

  async listAll(): Promise<Workout[]> {
    return this.workouts
  }

  async save(): Promise<void> {}

  async deleteById(): Promise<void> {}
}

const DEFINITIONS: Record<string, ExerciseDefinition> = {
  squat: {
    id: 'squat',
    name: 'Squat',
    defaultPlateIncrement: 2.5,
    defaultUnit: 'kg',
    createdAtMs: 0,
    archived: false,
  },
}

describe('WorkoutHistoryScreen', () => {
  it('shows empty state when no completed workouts', async () => {
    const repo = new MemoryWorkoutRepository([])
    render(
      <WorkoutHistoryScreen
        workoutRepository={repo}
        exerciseDefinitions={DEFINITIONS}
      />
    )

    expect(
      await screen.findByText('No completed workouts yet')
    ).toBeInTheDocument()
  })

  it('renders completed workouts list', async () => {
    const workouts: Workout[] = [
      {
        id: 'w-1',
        dateMs: 0,
        exerciseInstances: [],
        variation: 'A',
        startedAtMs: 0,
        completedAtMs: 1000,
        completed: true,
      },
    ]
    const repo = new MemoryWorkoutRepository(workouts)

    render(
      <WorkoutHistoryScreen
        workoutRepository={repo}
        exerciseDefinitions={DEFINITIONS}
      />
    )

    expect(
      await screen.findByText('Variation A')
    ).toBeInTheDocument()
  })
})
