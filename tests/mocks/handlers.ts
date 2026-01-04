import { http, HttpResponse } from 'msw'

// Mock meeting data
const mockMeetingTypes = [
    { id: 'intro-id', name: 'intro', description: 'Introductory meeting', duration_minutes: 30, price_usd: 0, is_free: true, is_active: true },
    { id: 'review-id', name: 'review', description: 'Project review', duration_minutes: 120, price_usd: 70, is_free: false, is_active: true }
]

const mockPricing = [
    { id: 'p1', meeting_type_id: 'review-id', country_code: 'PE', price_usd: 40 },
    { id: 'p2', meeting_type_id: 'review-id', country_code: 'CL', price_usd: 70 },
    { id: 'p3', meeting_type_id: 'review-id', country_code: 'MX', price_usd: 70 },
    { id: 'p4', meeting_type_id: 'review-id', country_code: 'CO', price_usd: 50 },
    { id: 'p5', meeting_type_id: 'review-id', country_code: 'AR', price_usd: 40 },
    { id: 'p6', meeting_type_id: 'review-id', country_code: 'BR', price_usd: 50 },
    { id: 'p7', meeting_type_id: 'review-id', country_code: 'US', price_usd: 70 },
    { id: 'p8', meeting_type_id: 'review-id', country_code: 'DEFAULT', price_usd: 70 }
]

const mockBookings = [
    {
        id: 'booking-1',
        user_id: 'test-user-id',
        meeting_type_id: 'review-id',
        project_id: 'project-1',
        scheduled_at: '2025-02-01T10:00:00Z',
        duration_minutes: 120,
        status: 'pending',
        price_usd: 70,
        country_code: 'CL',
        notes: 'Review my project',
        admin_notes: null,
        report_url: null,
        meeting_type: { name: 'review', duration_minutes: 120 },
        project: { name: 'Test Project' }
    }
]

export const handlers = [
    // Supabase Auth mock
    http.get('*/auth/v1/user', () => {
        return HttpResponse.json({
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'authenticated',
        })
    }),

    // Supabase session mock
    http.get('*/auth/v1/session', () => {
        return HttpResponse.json({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: {
                id: 'test-user-id',
                email: 'test@example.com',
            },
        })
    }),

    // Example API handler for projects
    http.get('*/rest/v1/projects*', () => {
        return HttpResponse.json([
            {
                id: 'project-1',
                name: 'Test Project',
                description: 'A test project',
                industry: 'tech',
                stage: 'mvp',
            },
        ])
    }),

    // AI chat endpoint mock
    http.post('/api/ai/chat', async () => {
        return HttpResponse.json({
            message: 'This is a mock AI response for testing purposes.',
        })
    }),

    // Meeting API endpoints
    http.get('/api/meetings', () => {
        return HttpResponse.json({
            meetingTypes: mockMeetingTypes,
            userCountry: 'CL'
        })
    }),

    http.post('/api/meetings', async ({ request }) => {
        const body = await request.json() as { meeting_type_id: string; scheduled_at: string; notes?: string }
        const newBooking = {
            id: 'new-booking-id',
            user_id: 'test-user-id',
            meeting_type_id: body.meeting_type_id,
            scheduled_at: body.scheduled_at,
            duration_minutes: body.meeting_type_id === 'intro-id' ? 30 : 120,
            status: 'pending',
            price_usd: body.meeting_type_id === 'intro-id' ? 0 : 70,
            country_code: 'CL',
            notes: body.notes || null,
            created_at: new Date().toISOString()
        }
        return HttpResponse.json({ booking: newBooking })
    }),

    http.get('/api/meetings/bookings', () => {
        return HttpResponse.json({ bookings: mockBookings })
    }),

    // Admin meeting API endpoints
    http.get('/api/admin/meetings/types', () => {
        return HttpResponse.json({ meetingTypes: mockMeetingTypes })
    }),

    http.get('/api/admin/meetings/pricing', () => {
        return HttpResponse.json({ pricing: mockPricing })
    }),

    http.get('/api/admin/meetings/bookings', () => {
        return HttpResponse.json({ bookings: mockBookings })
    }),

    http.patch('/api/admin/meetings/bookings/:id', async ({ params, request }) => {
        const body = await request.json() as { status?: string; admin_notes?: string; report_url?: string }
        const updatedBooking = {
            ...mockBookings[0],
            id: params.id,
            status: body.status || mockBookings[0].status,
            admin_notes: body.admin_notes || null,
            report_url: body.report_url || null
        }
        return HttpResponse.json({ booking: updatedBooking })
    }),

    http.post('/api/admin/meetings/pricing', async ({ request }) => {
        const body = await request.json() as { meeting_type_id: string; country_code: string; price_usd: number }
        const updatedPricing = {
            id: 'new-pricing-id',
            meeting_type_id: body.meeting_type_id,
            country_code: body.country_code,
            price_usd: body.price_usd
        }
        return HttpResponse.json({ pricing: updatedPricing })
    }),
]
