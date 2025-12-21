import { describe, it, expect } from 'vitest'
import { formatElapsed } from './StopwatchDisplay'

describe('formatElapsed', () => {
  it('pads seconds with leading zero', () => {
    expect(formatElapsed(5)).toBe('0:05')
  })

  it('formats minutes and seconds correctly', () => {
    expect(formatElapsed(65)).toBe('1:05')
  })

  it('handles exact minutes', () => {
    expect(formatElapsed(180)).toBe('3:00')
  })
})
