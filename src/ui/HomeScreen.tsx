interface HomeScreenProps {
  hasActiveWorkout: boolean
  onResume: () => void
  onStartNew: () => void
  onViewHistory: () => void
  onViewSettings: () => void
}

export default function HomeScreen({
  hasActiveWorkout,
  onResume,
  onStartNew,
  onViewHistory,
  onViewSettings,
}: HomeScreenProps) {
  return (
    <div>
      <h1>Workout Tracker</h1>
      {hasActiveWorkout ? (
        <div>
          <div>Workout in progress</div>
          <button type="button" onClick={onResume}>
            Resume Workout
          </button>
        </div>
      ) : (
        <button type="button" onClick={onStartNew}>
          Start New Workout
        </button>
      )}
      <div>
        <button type="button" onClick={onViewHistory}>
          Workout History
        </button>
        <button type="button" onClick={onViewSettings}>
          Exercise Settings
        </button>
      </div>
    </div>
  )
}
