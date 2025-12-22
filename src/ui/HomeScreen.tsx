import Button from './Button'

interface HomeScreenProps {
  hasActiveWorkout: boolean
  resumeExerciseNames?: string[]
  onResume: () => void
  onStartNew: () => void
  onViewHistory: () => void
  onViewSettings: () => void
}

export default function HomeScreen({
  hasActiveWorkout,
  resumeExerciseNames,
  onResume,
  onStartNew,
  onViewHistory,
  onViewSettings,
}: HomeScreenProps) {
  const resumeSummary =
    resumeExerciseNames && resumeExerciseNames.length > 0
      ? resumeExerciseNames.join(' • ')
      : null

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '32px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div>
        <h1 style={{ margin: 0 }}>Workout Tracker</h1>
      </div>
      {hasActiveWorkout ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Resume workout"
          onClick={onResume}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onResume()
            }
          }}
          style={{
            border: '1px solid #d6d6d6',
            borderRadius: '12px',
            padding: '16px',
            background: '#f9f9f9',
            textAlign: 'left',
            minHeight: '72px',
          }}
        >
          <div style={{ fontSize: '0.95rem', color: '#666' }}>
            Workout in progress
          </div>
          <div style={{ fontSize: '0.9rem', color: '#444' }}>
            {resumeSummary ? `(${resumeSummary})` : ''}
          </div>
          <div style={{ marginTop: '10px' }}>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={event => {
                event.stopPropagation()
                onResume()
              }}
            >
              Resume Workout
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={onStartNew}
          style={{ width: '100%', minHeight: '52px' }}
        >
          Start New Workout
        </Button>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Button
          variant="secondary"
          onClick={onViewHistory}
          style={{ width: '100%', minHeight: '48px' }}
        >
          Workout History
        </Button>
        <Button
          variant="secondary"
          onClick={onViewSettings}
          style={{ width: '100%', minHeight: '48px' }}
        >
          Exercise Settings
        </Button>
      </div>
    </div>
  )
}
