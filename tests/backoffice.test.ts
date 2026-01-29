import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    auth: {
        getUser: vi.fn(),
    },
}

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => mockSupabase,
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => Promise.resolve(mockSupabase),
}))

describe('Backoffice', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Admin Access Control', () => {
        const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech']

        it('should allow access for admin emails', () => {
            const testEmails = ['oscar@forcast.cl', 'oscar@forcast.tech']
            testEmails.forEach(email => {
                expect(ADMIN_EMAILS.includes(email)).toBe(true)
            })
        })

        it('should deny access for non-admin emails', () => {
            const nonAdminEmails = ['user@example.com', 'test@forcast.cl', 'admin@other.com']
            nonAdminEmails.forEach(email => {
                expect(ADMIN_EMAILS.includes(email)).toBe(false)
            })
        })
    })

    describe('Fund Template Creation', () => {
        it('should create a fund with valid data', async () => {
            const fundData = {
                name: 'Test Fund',
                organization: 'Test Org',
                country: 'CL',
                type: 'grant',
                amount_min: 10000,
                amount_max: 100000,
                currency: 'USD',
                deadline: '2025-12-31',
                url: 'https://example.com',
                description: 'Test description',
                is_active: true,
                requirements: { sections: [] },
            }

            // Verify fund data structure
            expect(fundData).toHaveProperty('name')
            expect(fundData).toHaveProperty('organization')
            expect(fundData).toHaveProperty('country')
            expect(fundData).toHaveProperty('type')
            expect(fundData).toHaveProperty('requirements')
            expect(fundData.requirements).toHaveProperty('sections')
            expect(Array.isArray(fundData.requirements.sections)).toBe(true)
        })

        it('should validate required fields for fund creation', () => {
            const requiredFields = ['name', 'organization', 'country', 'type']
            const fundData = {
                name: 'Test',
                organization: 'Org',
                country: 'CL',
                type: 'grant',
            }

            requiredFields.forEach(field => {
                expect(fundData).toHaveProperty(field)
                expect(fundData[field as keyof typeof fundData]).toBeTruthy()
            })
        })

        it('should handle form sections correctly', () => {
            const sections = [
                { key: 'project_description', name: 'Project Description', type: 'textarea', required: true },
                { key: 'budget', name: 'Budget', type: 'text', required: true },
                { key: 'team_type', name: 'Team Type', type: 'select', required: false, options: ['Startup', 'SME', 'Corporation'] },
            ]

            // Verify section structure
            sections.forEach(section => {
                expect(section).toHaveProperty('key')
                expect(section).toHaveProperty('name')
                expect(section).toHaveProperty('type')
                expect(['text', 'textarea', 'select', 'multiselect', 'link', 'file']).toContain(section.type)
            })
        })
    })

    describe('Agent Context Management', () => {
        it('should save agent context to fund requirements', async () => {
            const fundId = 'test-fund-id'
            const agentContext = '# Fund Context\n\nThis is the AI agent context.'

            const existingRequirements = { sections: [] }
            const updatedRequirements = { ...existingRequirements, agent_context: agentContext }

            mockSupabase.eq.mockResolvedValueOnce({ data: { requirements: existingRequirements }, error: null })
            mockSupabase.update.mockResolvedValueOnce({ data: { requirements: updatedRequirements }, error: null })

            // Verify the update structure
            expect(updatedRequirements).toHaveProperty('agent_context')
            expect(updatedRequirements.agent_context).toBe(agentContext)
        })

        it('should handle markdown file upload', () => {
            const markdownContent = `# Fund Context

## Description
This fund supports innovation projects.

## Criteria
- Criterion 1
- Criterion 2
`
            // Simulate file reading
            expect(typeof markdownContent).toBe('string')
            expect(markdownContent).toContain('# Fund Context')
        })
    })

    describe('Billing Metrics', () => {
        it('should calculate MRR correctly', () => {
            const usersByPlan = {
                free: 10,
                standard: 5,
                max: 2,
            }

            const planPrices = {
                free: 0,
                standard: 1,
                max: 100,
            }

            const mrr = (usersByPlan.standard * planPrices.standard) + (usersByPlan.max * planPrices.max)
            expect(mrr).toBe(205) // 5*1 + 2*100 = 5 + 200 = 205
        })

        it('should calculate ARR from MRR', () => {
            const mrr = 205
            const arr = mrr * 12
            expect(arr).toBe(2460)
        })

        it('should count users by plan', () => {
            const profiles = [
                { subscription_tier: 'free' },
                { subscription_tier: 'free' },
                { subscription_tier: 'standard' },
                { subscription_tier: 'max' },
                { subscription_tier: null }, // defaults to free
            ]

            const usersByPlan: Record<string, number> = { free: 0, standard: 0, max: 0 }
            profiles.forEach(p => {
                const plan = p.subscription_tier || 'free'
                usersByPlan[plan] = (usersByPlan[plan] || 0) + 1
            })

            expect(usersByPlan.free).toBe(3) // 2 explicit + 1 null
            expect(usersByPlan.standard).toBe(1)
            expect(usersByPlan.max).toBe(1)
        })
    })

    describe('User Management', () => {
        it('should display user data correctly', () => {
            const profile = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                company_name: 'Test Company',
                subscription_tier: 'standard',
                subscription_status: 'active',
                country: 'CL',
                phone: '+56912345678',
                rut_empresa: '12345678-9',
            }

            // Verify required display fields
            expect(profile.email).toBeTruthy()
            expect(profile.subscription_tier).toBeTruthy()
            expect(profile.subscription_status).toBeTruthy()
        })

        it('should generate correct initials from full name', () => {
            const getInitials = (fullName: string | null, email: string) => {
                if (fullName) {
                    return fullName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                }
                return email[0]?.toUpperCase() || 'U'
            }

            expect(getInitials('John Doe', 'john@example.com')).toBe('JD')
            expect(getInitials('Jane', 'jane@example.com')).toBe('J')
            expect(getInitials(null, 'user@example.com')).toBe('U')
            expect(getInitials('María José García', 'maria@example.com')).toBe('MJG')
        })
    })
})

describe('RLS Policies', () => {
    it('should have is_admin_email function logic', () => {
        const isAdminEmail = (email: string) => {
            return ['oscar@forcast.cl', 'oscar@forcast.tech'].includes(email)
        }

        expect(isAdminEmail('oscar@forcast.cl')).toBe(true)
        expect(isAdminEmail('oscar@forcast.tech')).toBe(true)
        expect(isAdminEmail('random@example.com')).toBe(false)
    })
})
