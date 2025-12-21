export const STRONGLIFTS_5X5 = {
  variations: {
    A: ['squat', 'bench-press', 'barbell-row'],
    B: ['squat', 'overhead-press', 'deadlift'],
  },
  setSchemes: {
    squat: { sets: 5, reps: 5 },
    'bench-press': { sets: 5, reps: 5 },
    'barbell-row': { sets: 5, reps: 5 },
    'overhead-press': { sets: 5, reps: 5 },
    deadlift: { sets: 1, reps: 5 },
  },
} as const
