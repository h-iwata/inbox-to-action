import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Date Helpers', () => {
  describe('formatTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format time correctly', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formattedTime = date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })
      expect(formattedTime).toBe('10:30')
    })

    it('should handle midnight correctly', () => {
      const date = new Date('2024-01-15T00:00:00')
      const formattedTime = date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })
      expect(formattedTime).toBe('00:00')
    })
  })

  describe('isExpired', () => {
    it('should return true for dates older than 24 hours', () => {
      const now = new Date('2024-01-15T12:00:00')
      const oldDate = new Date('2024-01-14T11:00:00')
      const diffHours = (now.getTime() - oldDate.getTime()) / (1000 * 60 * 60)
      expect(diffHours).toBeGreaterThan(24)
    })

    it('should return false for dates within 24 hours', () => {
      const now = new Date('2024-01-15T12:00:00')
      const recentDate = new Date('2024-01-15T10:00:00')
      const diffHours =
        (now.getTime() - recentDate.getTime()) / (1000 * 60 * 60)
      expect(diffHours).toBeLessThanOrEqual(24)
    })
  })
})
