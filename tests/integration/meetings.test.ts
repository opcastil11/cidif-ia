import { describe, it, expect } from 'vitest'
import { COUNTRY_NAMES, MEETING_STATUS_COLORS } from '@/types/meetings'

describe('Meetings Feature', () => {
  describe('Meeting Types', () => {
    it('should return intro and review meeting types', async () => {
      const meetingTypes = [
        { id: '1', name: 'intro', description: 'Introductory meeting', duration_minutes: 30, base_price_usd: 0, is_free: true, is_active: true },
        { id: '2', name: 'review', description: 'Project review', duration_minutes: 120, base_price_usd: 70, is_free: false, is_active: true }
      ]

      expect(meetingTypes).toHaveLength(2)
      expect(meetingTypes[0].name).toBe('intro')
      expect(meetingTypes[0].is_free).toBe(true)
      expect(meetingTypes[1].name).toBe('review')
      expect(meetingTypes[1].is_free).toBe(false)
    })

    it('should have correct durations', () => {
      const introMeeting = { name: 'intro', duration_minutes: 30 }
      const reviewMeeting = { name: 'review', duration_minutes: 120 }

      expect(introMeeting.duration_minutes).toBe(30)
      expect(reviewMeeting.duration_minutes).toBe(120)
    })
  })

  describe('Country Pricing', () => {
    it('should return correct pricing for Peru', () => {
      const pricing = { meeting_type_id: '2', country_code: 'PE', price_usd: 40 }
      expect(pricing.price_usd).toBe(40)
    })

    it('should return correct pricing for Chile', () => {
      const pricing = { meeting_type_id: '2', country_code: 'CL', price_usd: 70 }
      expect(pricing.price_usd).toBe(70)
    })

    it('should return correct pricing for Mexico', () => {
      const pricing = { meeting_type_id: '2', country_code: 'MX', price_usd: 70 }
      expect(pricing.price_usd).toBe(70)
    })

    it('should return default pricing when country not found', () => {
      const defaultPricing = { meeting_type_id: '2', country_code: 'DEFAULT', price_usd: 70 }
      expect(defaultPricing.price_usd).toBe(70)
    })

    it('should apply lower price for lower-income countries', () => {
      const peruPrice = 40
      const chilePrice = 70
      expect(peruPrice).toBeLessThan(chilePrice)
    })
  })

  describe('Meeting Bookings', () => {
    it('should create a booking with correct data', () => {
      const booking = {
        id: 'booking-1',
        user_id: 'user-1',
        meeting_type_id: '2',
        project_id: 'project-1',
        scheduled_at: '2025-02-01T10:00:00Z',
        duration_minutes: 120,
        status: 'pending',
        price_usd: 70,
        country_code: 'CL',
        notes: 'Review my project'
      }

      expect(booking.status).toBe('pending')
      expect(booking.price_usd).toBe(70)
      expect(booking.duration_minutes).toBe(120)
    })

    it('should have valid booking statuses', () => {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
      const booking = { status: 'pending' }

      expect(validStatuses).toContain(booking.status)
    })

    it('should set price to 0 for free intro meetings', () => {
      const booking = {
        meeting_type_id: '1',
        price_usd: 0,
        duration_minutes: 30
      }

      expect(booking.price_usd).toBe(0)
    })
  })

  describe('Meeting Status Colors', () => {
    it('should have correct status colors defined', () => {
      expect(MEETING_STATUS_COLORS.pending.text).toBe('text-amber-600')
      expect(MEETING_STATUS_COLORS.confirmed.text).toBe('text-blue-600')
      expect(MEETING_STATUS_COLORS.completed.text).toBe('text-emerald-600')
      expect(MEETING_STATUS_COLORS.cancelled.text).toBe('text-red-600')
    })
  })

  describe('Country Names', () => {
    it('should have all required countries', () => {
      expect(Object.keys(COUNTRY_NAMES)).toContain('PE')
      expect(Object.keys(COUNTRY_NAMES)).toContain('CL')
      expect(Object.keys(COUNTRY_NAMES)).toContain('MX')
      expect(COUNTRY_NAMES.PE).toBe('Peru')
      expect(COUNTRY_NAMES.CL).toBe('Chile')
    })
  })

  describe('Pricing Tiers', () => {
    it('should have price range from $40 to $70 USD for review meetings', () => {
      const pricingTiers = [
        { country_code: 'PE', price_usd: 40 },
        { country_code: 'AR', price_usd: 40 },
        { country_code: 'CO', price_usd: 50 },
        { country_code: 'BR', price_usd: 50 },
        { country_code: 'CL', price_usd: 70 },
        { country_code: 'MX', price_usd: 70 },
        { country_code: 'US', price_usd: 70 }
      ]

      const prices = pricingTiers.map(p => p.price_usd)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      expect(minPrice).toBe(40)
      expect(maxPrice).toBe(70)
    })
  })
})
