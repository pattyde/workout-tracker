import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomeScreen from './HomeScreen'

describe('HomeScreen', () => {
  it('shows start new workout when no active workout', () => {
    render(
      <HomeScreen
        hasActiveWorkout={false}
        resumeExerciseNames={undefined}
        onResume={() => {}}
        onStartNew={() => {}}
        onViewHistory={() => {}}
        onViewSettings={() => {}}
      />
    )

    expect(
      screen.getByText('Start New Workout')
    ).toBeInTheDocument()
    expect(screen.queryByText('Resume Workout')).toBeNull()
  })

  it('shows resume when a workout is active', () => {
    render(
      <HomeScreen
        hasActiveWorkout={true}
        resumeExerciseNames={['Squat', 'Bench Press']}
        onResume={() => {}}
        onStartNew={() => {}}
        onViewHistory={() => {}}
        onViewSettings={() => {}}
      />
    )

    expect(
      screen.getByText('Workout in progress')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Resume Workout')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Start New Workout')
    ).toBeNull()
    expect(
      screen.getByText('(Squat • Bench Press)')
    ).toBeInTheDocument()
  })

  it('supports navigation actions', () => {
    const onStartNew = vi.fn()
    const onViewHistory = vi.fn()
    const onViewSettings = vi.fn()

    render(
      <HomeScreen
        hasActiveWorkout={false}
        resumeExerciseNames={undefined}
        onResume={() => {}}
        onStartNew={onStartNew}
        onViewHistory={onViewHistory}
        onViewSettings={onViewSettings}
      />
    )

    fireEvent.click(screen.getByText('Start New Workout'))
    fireEvent.click(screen.getByText('Workout History'))
    fireEvent.click(screen.getByText('Exercise Settings'))

    expect(onStartNew).toHaveBeenCalledTimes(1)
    expect(onViewHistory).toHaveBeenCalledTimes(1)
    expect(onViewSettings).toHaveBeenCalledTimes(1)
  })
})
