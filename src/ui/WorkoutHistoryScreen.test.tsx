import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Workout } from '../domain/models/Workout'
import type { WorkoutRepository } from '../data/WorkoutRepository'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import WorkoutHistoryScreen from './WorkoutHistoryScreen'
import type { ProgressionStateRepository } from '../data/ProgressionStateRepository'
import type { AppStateRepository } from '../data/AppStateRepository'
import type { AppState } from '../domain/models/AppState'
import type { ProgressionState } from '../domain/models/ProgressionState'

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

class MemoryProgressionStateRepository
  implements ProgressionStateRepository
{
  async getByExerciseDefinitionId(): Promise<ProgressionState | null> {
    return null
  }

  async listAll(): Promise<ProgressionState[]> {
    return []
  }

  async save(): Promise<void> {}

  async deleteByExerciseDefinitionId(): Promise<void> {}
}

class MemoryAppStateRepository implements AppStateRepository {
  public state: AppState | null = null

  async get(): Promise<AppState | null> {
    return this.state
  }

  async save(state: AppState): Promise<void> {
    this.state = state
  }

  async clear(): Promise<void> {
    this.state = null
  }
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
    const progressionRepo = new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()
    render(
      <WorkoutHistoryScreen
        workoutRepository={repo}
        exerciseDefinitions={DEFINITIONS}
        progressionStateRepository={progressionRepo}
        appStateRepository={appStateRepo}
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
      {
        id: 'w-2',
        dateMs: 0,
        exerciseInstances: [],
        variation: 'B',
        startedAtMs: 0,
        completedAtMs: 2000,
        completed: true,
        deleted: true,
      },
    ]
    const repo = new MemoryWorkoutRepository(workouts)
    const progressionRepo = new MemoryProgressionStateRepository()
    const appStateRepo = new MemoryAppStateRepository()

    render(
      <WorkoutHistoryScreen
        workoutRepository={repo}
        exerciseDefinitions={DEFINITIONS}
        progressionStateRepository={progressionRepo}
        appStateRepository={appStateRepo}
      />
    )

    expect(
      await screen.findByText('Variation A')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Variation B')
    ).toBeNull()
  })
})
