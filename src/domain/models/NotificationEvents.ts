/**
 * NotificationEvent represents a domain-level notification
 * that the UI or platform layer can choose to display.
 */
export interface NotificationEvent {
    /** Stable identifier for the event */
    id: string
  
    /** Type of notification */
    type: 'rest-alert'
  
    /** Message suitable for display */
    message: string
  
    /** Threshold (in seconds) that triggered this event */
    thresholdSec: number
  
    /** Timestamp (epoch ms) when the event was generated */
    timestampMs: number
  }
  