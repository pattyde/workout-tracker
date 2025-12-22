import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Workout } from '../domain/models/Workout'
import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'
import type { EquipmentInventory } from '../domain/models/AppState'
import type { ProgressionState } from '../domain/models/ProgressionState'
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

const PROGRESSION_STATES: Record<string, ProgressionState> = {
  squat: {
    id: 'p-squat',
    exerciseDefinitionId: 'squat',
    currentWeight: 20,
    failureStreak: 0,
    plateIncrement: 2.5,
    unit: 'kg',
    preferredBarTypeId: 'olympic-20kg',
  },
}

const INVENTORY: EquipmentInventory = {
  bars: [
    {
      id: 'olympic-20kg',
      name: 'Olympic bar',
      weight: 20,
      unit: 'kg',
      enabled: true,
    },
  ],
  plates: [
    { weight: 20, unit: 'kg', quantity: 2 },
    { weight: 10, unit: 'kg', quantity: 2 },
    { weight: 5, unit: 'kg', quantity: 2 },
  ],
}

describe('ActiveWorkoutView', () => {
  it('renders variation and exercises', () => {
    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
        onSetTap={() => {}}
        onWorkWeightSave={() => {}}
      />
    )

    expect(screen.getByText('Variation A')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
    expect(screen.getByText('Work weight')).toBeInTheDocument()
    expect(screen.getByText('20 kg')).toBeInTheDocument()
    expect(screen.getByLabelText('Set 1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.queryByText('20 x 5')).toBeNull()
  })

  it('allows editing work weight', () => {
    const handleSave = vi.fn()

    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
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
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
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
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
        onSetTap={handleTap}
        onWorkWeightSave={() => {}}
      />
    )

    fireEvent.click(screen.getByLabelText('Set 1'))
    expect(handleTap).toHaveBeenCalledWith('set-1')
  })

  it('opens the plate calculator and shows plates', () => {
    const exercise = WORKOUT.exerciseInstances[0]
    if (!exercise) {
      throw new Error('Expected exercise instance')
    }

    const workout: Workout = {
      ...WORKOUT,
      exerciseInstances: [
        {
          ...exercise,
          workWeight: 60,
        },
      ],
    }

    render(
      <ActiveWorkoutView
        workout={workout}
        exerciseDefinitions={DEFINITIONS}
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
        onSetTap={() => {}}
        onWorkWeightSave={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Plates'))

    expect(
      screen.getByText('Plate calculator')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Bar: Olympic bar (20 kg)')
    ).toBeInTheDocument()
    expect(
      screen.getByText('1 × 20 kg')
    ).toBeInTheDocument()
  })

  it('shows a warning when exact weight is not achievable', () => {
    const exercise = WORKOUT.exerciseInstances[0]
    if (!exercise) {
      throw new Error('Expected exercise instance')
    }

    const workout: Workout = {
      ...WORKOUT,
      exerciseInstances: [
        {
          ...exercise,
          workWeight: 62.5,
        },
      ],
    }

    render(
      <ActiveWorkoutView
        workout={workout}
        exerciseDefinitions={DEFINITIONS}
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
        onSetTap={() => {}}
        onWorkWeightSave={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Plates'))

    expect(
      screen.getByText(
        /Target weight cannot be loaded exactly/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('Difference: 2.5 kg')
    ).toBeInTheDocument()
  })

  it('does not modify workout state when viewing the calculator', () => {
    const handleSave = vi.fn()
    const handleTap = vi.fn()

    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={() => {}}
        onSetTap={handleTap}
        onWorkWeightSave={handleSave}
      />
    )

    fireEvent.click(screen.getByText('Plates'))
    fireEvent.click(screen.getByText('Close'))

    expect(handleSave).not.toHaveBeenCalled()
    expect(handleTap).not.toHaveBeenCalled()
  })

  it('confirms variation switch explicitly', () => {
    const handleChange = vi.fn()

    render(
      <ActiveWorkoutView
        workout={WORKOUT}
        exerciseDefinitions={DEFINITIONS}
        progressionStates={PROGRESSION_STATES}
        equipmentInventory={INVENTORY}
        onVariationChange={handleChange}
        onSetTap={() => {}}
        onWorkWeightSave={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Change variation'))
    fireEvent.click(screen.getByLabelText('Variation B'))
    fireEvent.click(screen.getByText('Confirm switch'))

    expect(handleChange).toHaveBeenCalledWith('B')
  })
})
