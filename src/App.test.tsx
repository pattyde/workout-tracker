import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import type { Workout } from './domain/models/Workout'

const MOCK_WORKOUT: Workout = {
  id: 'workout-1',
  dateMs: 0,
  exerciseInstances: [],
  variation: 'A',
  completed: false,
}

vi.mock('./services/startOrResumeWorkoutService', () => ({
  startOrResumeWorkout: vi.fn(async () => MOCK_WORKOUT),
}))

describe('App', () => {
  it('renders the app', async () => {
    render(<App />)
    expect(
      await screen.findByText('Workout Tracker')
    ).toBeInTheDocument()
  })
})
