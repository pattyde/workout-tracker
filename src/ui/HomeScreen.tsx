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
    <>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingBottom: '140px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0 }}>5x5 Tracker</h1>
        </div>
        {/* no workout-in-progress card */}
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
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 16px',
          paddingBottom:
            'calc(12px + env(safe-area-inset-bottom))',
          background: '#ffffff',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {hasActiveWorkout ? (
            <>
              <div
                style={{
                  textAlign: 'center',
                  color: '#555',
                  fontSize: '0.9rem',
                }}
              >
                <div>Workout in progress</div>
                <div>
                  {resumeSummary ? `(${resumeSummary})` : ''}
                </div>
              </div>
              <Button
                variant="primary"
                onClick={onResume}
                style={{
                  width: '100%',
                  minHeight: '52px',
                }}
              >
                Resume Workout
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={onStartNew}
              style={{
                width: '100%',
                minHeight: '52px',
              }}
            >
              Start New Workout
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
