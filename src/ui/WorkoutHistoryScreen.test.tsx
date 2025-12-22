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
        onBack={() => {}}
      />
    )

    expect(
      await screen.findByText('No completed workouts yet')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Start a workout to see your history here.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('renders completed workouts list', async () => {
    const workouts: Workout[] = [
      {
        id: 'w-1',
        dateMs: 0,
        exerciseInstances: [
          {
            id: 'ex-1',
            exerciseDefinitionId: 'squat',
            workoutId: 'w-1',
            orderIndex: 0,
            sets: [
              {
                id: 'set-1',
                orderIndex: 0,
                type: 'work',
                enabled: true,
                targetWeight: 60,
                targetReps: 5,
                status: 'completed',
                actualReps: 5,
              },
            ],
            workWeight: 60,
            barTypeId: 'olympic-20kg',
            useSharedBarLoading: false,
          },
        ],
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
        onBack={() => {}}
      />
    )

    expect(
      await screen.findByText('Workout A')
    ).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('1×5 60 kg')).toBeInTheDocument()
    expect(
      screen.queryByText('Workout B')
    ).toBeNull()
  })
})
