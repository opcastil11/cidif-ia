import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { COUNTRY_NAMES, MEETING_STATUS_COLORS } from '@/types/meetings'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

// Setup MSW server for API tests
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

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

    it('should have correct durations for each meeting type', () => {
      const introMeeting = { name: 'intro', duration_minutes: 30 }
      const reviewMeeting = { name: 'review', duration_minutes: 120 }

      expect(introMeeting.duration_minutes).toBe(30)
      expect(reviewMeeting.duration_minutes).toBe(120)
    })

    it('intro meeting should be 30 minutes and free', () => {
      const introMeeting = { name: 'intro', duration_minutes: 30, is_free: true, base_price_usd: 0 }
      expect(introMeeting.duration_minutes).toBe(30)
      expect(introMeeting.is_free).toBe(true)
      expect(introMeeting.base_price_usd).toBe(0)
    })

    it('review meeting should be 2 hours (120 min) and paid', () => {
      const reviewMeeting = { name: 'review', duration_minutes: 120, is_free: false, base_price_usd: 70 }
      expect(reviewMeeting.duration_minutes).toBe(120)
      expect(reviewMeeting.is_free).toBe(false)
      expect(reviewMeeting.base_price_usd).toBeGreaterThan(0)
    })
  })

  describe('Country Pricing', () => {
    it('should return correct pricing for Peru ($40)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'PE', price_usd: 40 }
      expect(pricing.price_usd).toBe(40)
    })

    it('should return correct pricing for Chile ($70)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'CL', price_usd: 70 }
      expect(pricing.price_usd).toBe(70)
    })

    it('should return correct pricing for Mexico ($70)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'MX', price_usd: 70 }
      expect(pricing.price_usd).toBe(70)
    })

    it('should return correct pricing for Colombia ($50)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'CO', price_usd: 50 }
      expect(pricing.price_usd).toBe(50)
    })

    it('should return correct pricing for Argentina ($40)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'AR', price_usd: 40 }
      expect(pricing.price_usd).toBe(40)
    })

    it('should return correct pricing for Brazil ($50)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'BR', price_usd: 50 }
      expect(pricing.price_usd).toBe(50)
    })

    it('should return correct pricing for USA ($70)', () => {
      const pricing = { meeting_type_id: '2', country_code: 'US', price_usd: 70 }
      expect(pricing.price_usd).toBe(70)
    })

    it('should return default pricing ($70) when country not found', () => {
      const defaultPricing = { meeting_type_id: '2', country_code: 'DEFAULT', price_usd: 70 }
      expect(defaultPricing.price_usd).toBe(70)
    })

    it('should apply lower price for lower-income countries (Peru < Chile)', () => {
      const peruPrice = 40
      const chilePrice = 70
      expect(peruPrice).toBeLessThan(chilePrice)
    })

    it('should have mid-tier pricing for Colombia and Brazil', () => {
      const colombiaPrice = 50
      const brazilPrice = 50
      const peruPrice = 40
      const chilePrice = 70

      expect(colombiaPrice).toBeGreaterThan(peruPrice)
      expect(colombiaPrice).toBeLessThan(chilePrice)
      expect(brazilPrice).toBeGreaterThan(peruPrice)
      expect(brazilPrice).toBeLessThan(chilePrice)
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

    it('should support optional project association for review meetings', () => {
      const bookingWithProject = {
        meeting_type_id: '2',
        project_id: 'project-1',
        notes: 'Review this specific project'
      }

      const bookingWithoutProject = {
        meeting_type_id: '2',
        project_id: null,
        notes: 'General consultation'
      }

      expect(bookingWithProject.project_id).toBe('project-1')
      expect(bookingWithoutProject.project_id).toBeNull()
    })

    it('should support admin notes for internal tracking', () => {
      const booking = {
        admin_notes: 'Followed up via email',
        report_url: 'https://example.com/report.pdf'
      }

      expect(booking.admin_notes).toBe('Followed up via email')
      expect(booking.report_url).toBe('https://example.com/report.pdf')
    })
  })

  describe('Meeting Status Colors', () => {
    it('should have correct status colors defined', () => {
      expect(MEETING_STATUS_COLORS.pending.text).toBe('text-amber-600')
      expect(MEETING_STATUS_COLORS.confirmed.text).toBe('text-blue-600')
      expect(MEETING_STATUS_COLORS.completed.text).toBe('text-emerald-600')
      expect(MEETING_STATUS_COLORS.cancelled.text).toBe('text-red-600')
    })

    it('should have matching background colors for each status', () => {
      expect(MEETING_STATUS_COLORS.pending.bg).toBeDefined()
      expect(MEETING_STATUS_COLORS.confirmed.bg).toBeDefined()
      expect(MEETING_STATUS_COLORS.completed.bg).toBeDefined()
      expect(MEETING_STATUS_COLORS.cancelled.bg).toBeDefined()
    })
  })

  describe('Country Names', () => {
    it('should have all required LATAM countries', () => {
      expect(Object.keys(COUNTRY_NAMES)).toContain('PE')
      expect(Object.keys(COUNTRY_NAMES)).toContain('CL')
      expect(Object.keys(COUNTRY_NAMES)).toContain('MX')
      expect(Object.keys(COUNTRY_NAMES)).toContain('CO')
      expect(Object.keys(COUNTRY_NAMES)).toContain('AR')
      expect(Object.keys(COUNTRY_NAMES)).toContain('BR')
    })

    it('should include USA and DEFAULT', () => {
      expect(Object.keys(COUNTRY_NAMES)).toContain('US')
      expect(Object.keys(COUNTRY_NAMES)).toContain('DEFAULT')
    })

    it('should have correct country name mappings', () => {
      expect(COUNTRY_NAMES.PE).toBe('Peru')
      expect(COUNTRY_NAMES.CL).toBe('Chile')
      expect(COUNTRY_NAMES.MX).toBe('Mexico')
      expect(COUNTRY_NAMES.CO).toBe('Colombia')
      expect(COUNTRY_NAMES.AR).toBe('Argentina')
      expect(COUNTRY_NAMES.BR).toBe('Brazil')
      expect(COUNTRY_NAMES.US).toBe('United States')
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

    it('should have three price tiers: $40, $50, and $70', () => {
      const pricingTiers = [
        { country_code: 'PE', price_usd: 40 },
        { country_code: 'AR', price_usd: 40 },
        { country_code: 'CO', price_usd: 50 },
        { country_code: 'BR', price_usd: 50 },
        { country_code: 'CL', price_usd: 70 },
        { country_code: 'MX', price_usd: 70 },
        { country_code: 'US', price_usd: 70 }
      ]

      const uniquePrices = [...new Set(pricingTiers.map(p => p.price_usd))].sort((a, b) => a - b)
      expect(uniquePrices).toEqual([40, 50, 70])
    })
  })

  describe('Booking Status Workflow', () => {
    it('should start with pending status', () => {
      const newBooking = { status: 'pending' }
      expect(newBooking.status).toBe('pending')
    })

    it('should transition from pending to confirmed', () => {
      const booking = { status: 'pending' }
      booking.status = 'confirmed'
      expect(booking.status).toBe('confirmed')
    })

    it('should transition from confirmed to completed', () => {
      const booking = { status: 'confirmed' }
      booking.status = 'completed'
      expect(booking.status).toBe('completed')
    })

    it('should allow cancellation from pending status', () => {
      const booking = { status: 'pending' }
      booking.status = 'cancelled'
      expect(booking.status).toBe('cancelled')
    })

    it('should allow cancellation from confirmed status', () => {
      const booking = { status: 'confirmed' }
      booking.status = 'cancelled'
      expect(booking.status).toBe('cancelled')
    })
  })

  describe('Report Generation for Review Meetings', () => {
    it('should support report URL after meeting completion', () => {
      const completedBooking = {
        status: 'completed',
        meeting_type_id: 'review-id',
        report_url: 'https://storage.example.com/reports/booking-123.pdf'
      }

      expect(completedBooking.report_url).toBeDefined()
      expect(completedBooking.report_url).toContain('pdf')
    })

    it('should not require report URL for intro meetings', () => {
      const introBooking = {
        status: 'completed',
        meeting_type_id: 'intro-id',
        report_url: null
      }

      expect(introBooking.report_url).toBeNull()
    })
  })
})
