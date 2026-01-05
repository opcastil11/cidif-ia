import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the stripe packages
vi.mock('@stripe/stripe-js', () => ({
    loadStripe: vi.fn(() => Promise.resolve({ elements: vi.fn() })),
}))

vi.mock('stripe', () => {
    const MockStripe = vi.fn(() => ({
        customers: { list: vi.fn(), create: vi.fn() },
        checkout: { sessions: { create: vi.fn() } },
        billingPortal: { sessions: { create: vi.fn() } },
        webhooks: { constructEvent: vi.fn() },
        subscriptions: { list: vi.fn(), update: vi.fn(), cancel: vi.fn() },
    }))
    return { default: MockStripe }
})

describe('Stripe SDK Configuration', () => {
    describe('Client-side (getStripe)', () => {
        beforeEach(() => {
            vi.resetModules()
        })

        it('should export getStripe function from client module', async () => {
            const clientModule = await import('../lib/stripe/client')
            expect(clientModule.getStripe).toBeDefined()
            expect(typeof clientModule.getStripe).toBe('function')
        })

        it('should return a Promise when calling getStripe', async () => {
            const clientModule = await import('../lib/stripe/client')
            const result = clientModule.getStripe()
            expect(result).toBeInstanceOf(Promise)
        })
    })

    describe('Server-side (getStripeServer)', () => {
        const originalEnv = process.env

        beforeEach(() => {
            vi.resetModules()
            process.env = { ...originalEnv }
        })

        afterEach(() => {
            process.env = originalEnv
        })

        it('should export getStripeServer function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.getStripeServer).toBeDefined()
            expect(typeof serverModule.getStripeServer).toBe('function')
        })

        it('should export constructWebhookEvent function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.constructWebhookEvent).toBeDefined()
            expect(typeof serverModule.constructWebhookEvent).toBe('function')
        })

        it('should export createCheckoutSession function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.createCheckoutSession).toBeDefined()
            expect(typeof serverModule.createCheckoutSession).toBe('function')
        })

        it('should export createPortalSession function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.createPortalSession).toBeDefined()
            expect(typeof serverModule.createPortalSession).toBe('function')
        })

        it('should export getOrCreateCustomer function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.getOrCreateCustomer).toBeDefined()
            expect(typeof serverModule.getOrCreateCustomer).toBe('function')
        })

        it('should export getSubscriptionStatus function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.getSubscriptionStatus).toBeDefined()
            expect(typeof serverModule.getSubscriptionStatus).toBe('function')
        })

        it('should export cancelSubscription function', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
            const serverModule = await import('../lib/stripe/server')
            expect(serverModule.cancelSubscription).toBeDefined()
            expect(typeof serverModule.cancelSubscription).toBe('function')
        })
    })

    describe('Plan Configuration (index)', () => {
        it('should export PLANS object', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.PLANS).toBeDefined()
            expect(typeof indexModule.PLANS).toBe('object')
        })

        it('should have free, standard, and max plans', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.PLANS.free).toBeDefined()
            expect(indexModule.PLANS.standard).toBeDefined()
            expect(indexModule.PLANS.max).toBeDefined()
        })

        it('should have correct free plan configuration', async () => {
            const indexModule = await import('../lib/stripe/index')
            const { free } = indexModule.PLANS
            expect(free.id).toBe('free')
            expect(free.price).toBe(0)
            expect(free.limits.maxProjects).toBe(1)
            expect(free.limits.maxApplications).toBe(1)
        })

        it('should have correct standard plan configuration', async () => {
            const indexModule = await import('../lib/stripe/index')
            const { standard } = indexModule.PLANS
            expect(standard.id).toBe('standard')
            expect(standard.price).toBe(50)
            expect(standard.limits.maxProjects).toBe(5)
            expect(standard.limits.maxApplications).toBe(5)
        })

        it('should have correct max plan configuration', async () => {
            const indexModule = await import('../lib/stripe/index')
            const { max } = indexModule.PLANS
            expect(max.id).toBe('max')
            expect(max.price).toBe(100)
            expect(max.limits.maxProjects).toBe(-1) // unlimited
            expect(max.limits.maxApplications).toBe(-1) // unlimited
        })

        it('should export COUNTRY_PRICING object', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.COUNTRY_PRICING).toBeDefined()
        })

        it('should have country multipliers defined', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.COUNTRY_PRICING.CL.multiplier).toBe(0.6)
            expect(indexModule.COUNTRY_PRICING.MX.multiplier).toBe(0.5)
            expect(indexModule.COUNTRY_PRICING.AR.multiplier).toBe(0.4)
            expect(indexModule.COUNTRY_PRICING.US.multiplier).toBe(1)
        })

        it('should export getPriceForCountry function', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.getPriceForCountry).toBeDefined()

            // Test pricing calculation
            expect(indexModule.getPriceForCountry(100, 'CL')).toBe(60)
            expect(indexModule.getPriceForCountry(100, 'AR')).toBe(40)
            expect(indexModule.getPriceForCountry(100, 'US')).toBe(100)
            expect(indexModule.getPriceForCountry(100, 'XX')).toBe(100) // default
        })

        it('should export getPlanById function', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.getPlanById).toBeDefined()

            const freePlan = indexModule.getPlanById('free')
            expect(freePlan?.id).toBe('free')

            const nullPlan = indexModule.getPlanById('nonexistent')
            expect(nullPlan).toBeNull()
        })

        it('should export checkPlanLimit function', async () => {
            const indexModule = await import('../lib/stripe/index')
            expect(indexModule.checkPlanLimit).toBeDefined()

            const { free, max } = indexModule.PLANS

            // Test free plan limit
            const freeLimit = indexModule.checkPlanLimit(free, 'projects', 0)
            expect(freeLimit.allowed).toBe(true)
            expect(freeLimit.limit).toBe(1)
            expect(freeLimit.remaining).toBe(1)

            const freeLimitExceeded = indexModule.checkPlanLimit(free, 'projects', 1)
            expect(freeLimitExceeded.allowed).toBe(false)
            expect(freeLimitExceeded.remaining).toBe(0)

            // Test unlimited (max plan)
            const maxLimit = indexModule.checkPlanLimit(max, 'projects', 1000)
            expect(maxLimit.allowed).toBe(true)
            expect(maxLimit.limit).toBe(-1) // unlimited
        })
    })
})
