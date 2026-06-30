import Button from './Button'

interface HomeScreenProps {
  hasActiveWorkout: boolean
  resumeExerciseNames?: string[]
  deloadRecommended: boolean
  onResume: () => void
  onStartNew: () => void
  onDeload: (percentage: 10 | 25 | 50) => void
  onViewHistory: () => void
  onViewSettings: () => void
  onViewImportExport: () => void
}

export default function HomeScreen({
  hasActiveWorkout,
  resumeExerciseNames,
  deloadRecommended,
  onResume,
  onStartNew,
  onDeload,
  onViewHistory,
  onViewSettings,
  onViewImportExport,
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
          paddingBottom: 'calc(140px + env(safe-area-inset-bottom))',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0 }}>5x5 Tracker</h1>
        </div>
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
          <Button
            variant="secondary"
            onClick={onViewImportExport}
            style={{ width: '100%', minHeight: '48px' }}
          >
            Import / Export
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
            'calc(25px + env(safe-area-inset-bottom))',
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
            <>
              {deloadRecommended && (
                <div
                  style={{
                    width: '100%',
                    background: '#fefce8',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: '#78350f',
                      textAlign: 'center',
                    }}
                  >
                    It's been a while. Consider a deload before starting.
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'center',
                    }}
                  >
                    {([10, 25, 50] as const).map(pct => (
                      <Button
                        key={pct}
                        variant="secondary"
                        onClick={() => onDeload(pct)}
                        style={{ flex: 1, minHeight: '44px' }}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                  <button
                    onClick={onStartNew}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#92400e',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '2px 0',
                    }}
                  >
                    Skip deload
                  </button>
                </div>
              )}
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
            </>
          )}
        </div>
      </div>
    </>
  )
}
