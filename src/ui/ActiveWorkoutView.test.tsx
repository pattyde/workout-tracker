import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Workout } from '../domain/models/Workout'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import ActiveWorkoutView from './ActiveWorkoutView'

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

const WORKOUT: Workout = {
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
          targetWeight: 20,
          targetReps: 5,
          status: 'pending',
        },
      ],
      workWeight: 20,
      barTypeId: 'olympic-20kg',
      useSharedBarLoading: false,
    },
  ],
  variation: 'A',
  completed: false,
}

describe('ActiveWorkoutView', () => {
  it('renders variation and exercises', () => {
    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        onSetTap={() => {}}
        onWorkWeightSave={() => {}}
      />
    )

    expect(screen.getByText('Variation A')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('Work weight')).toBeInTheDocument()
    expect(screen.getByText('20 kg')).toBeInTheDocument()
    expect(screen.getByText('Set 1')).toBeInTheDocument()
    expect(screen.getByText('Reps: 5')).toBeInTheDocument()
    expect(screen.queryByText('20 x 5')).toBeNull()
  })

  it('allows editing work weight', () => {
    const handleSave = vi.fn()

    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        onSetTap={() => {}}
        onWorkWeightSave={handleSave}
      />
    )

    fireEvent.click(screen.getByLabelText('Edit work weight'))
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '25' } })
    fireEvent.click(screen.getByText('Save'))

    expect(handleSave).toHaveBeenCalledWith('ex-1', 25)
  })

  it('cancels work weight edits', () => {
    const handleSave = vi.fn()

    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        onSetTap={() => {}}
        onWorkWeightSave={handleSave}
      />
    )

    fireEvent.click(screen.getByLabelText('Edit work weight'))
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.click(screen.getByText('Cancel'))

    expect(handleSave).not.toHaveBeenCalled()
  })

  it('still allows set taps', () => {
    const handleTap = vi.fn()

    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        onSetTap={handleTap}
        onWorkWeightSave={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Set 1'))
    expect(handleTap).toHaveBeenCalledWith('set-1')
  })
})
