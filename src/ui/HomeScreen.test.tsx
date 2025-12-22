import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomeScreen from './HomeScreen'

describe('HomeScreen', () => {
  it('shows start new workout when no active workout', () => {
    render(
      <HomeScreen
        hasActiveWorkout={false}
        onResume={() => {}}
        onStartNew={() => {}}
        onViewHistory={() => {}}
        onViewSettings={() => {}}
      />
    )

    expect(
      screen.getByText('Start New Workout')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Resume Workout')
    ).toBeNull()
  })

  it('shows resume when a workout is active', () => {
    render(
      <HomeScreen
        hasActiveWorkout={true}
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
  })

  it('supports navigation actions', () => {
    const onStartNew = vi.fn()
    const onViewHistory = vi.fn()
    const onViewSettings = vi.fn()

    render(
      <HomeScreen
        hasActiveWorkout={false}
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
