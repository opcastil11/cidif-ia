import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
    if (!_stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not set')
        }

        // Log key info for debugging (never log full key)
        const keyPrefix = secretKey.substring(0, 12)
        const keyLength = secretKey.length
        console.log(`[Stripe] Initializing with key: ${keyPrefix}... (length: ${keyLength})`)

        _stripe = new Stripe(secretKey, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        })
    }
    return _stripe
}

// Export stripe instance using Proxy for full lazy initialization
// This properly delegates ALL property access to the Stripe instance
export const stripe = new Proxy({} as Stripe, {
    get(_, prop: string | symbol) {
        const instance = getStripe()
        const value = instance[prop as keyof Stripe]
        // Bind functions to maintain correct `this` context
        if (typeof value === 'function') {
            return value.bind(instance)
        }
        return value
    }
})

// Plan configuration
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'Para empezar a explorar',
        price: 0,
        priceId: null,
        limits: {
            maxProjects: 1,
            maxApplications: 1,
            aiTokensPerMonth: 10000, // ~10k tokens for free users
        },
        features: [
            '1 proyecto',
            '1 postulación activa',
            'Asistente IA (limitado)',
            'Catálogo de fondos',
        ],
    },
    standard: {
        id: 'standard',
        name: 'Standard',
        description: 'Para equipos en crecimiento',
        price: 50,
        priceId: process.env.STRIPE_STANDARD_PRICE_ID || null,
        limits: {
            maxProjects: 5,
            maxApplications: 5,
            aiTokensPerMonth: 100000, // 100k tokens
        },
        features: [
            'Hasta 5 proyectos',
            'Hasta 5 postulaciones activas',
            'Asistente IA completo',
            'Auto-llenado con IA',
            'Investigación con IA',
            'Soporte por email',
        ],
    },
    max: {
        id: 'max',
        name: 'Max',
        description: 'Para empresas y agencias',
        price: 100,
        priceId: process.env.STRIPE_MAX_PRICE_ID || null,
        limits: {
            maxProjects: -1, // unlimited
            maxApplications: -1, // unlimited
            aiTokensPerMonth: -1, // unlimited
        },
        features: [
            'Proyectos ilimitados',
            'Postulaciones ilimitadas',
            'Asistente IA ilimitado',
            'Auto-llenado con IA',
            'Investigación con IA',
            'Soporte prioritario',
            'Acceso anticipado a nuevas funciones',
        ],
    },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = typeof PLANS[PlanId]

// Country-based pricing multipliers
export const COUNTRY_PRICING: Record<string, { multiplier: number; currency: string }> = {
    // Latin America (discounted)
    CL: { multiplier: 0.6, currency: 'usd' }, // Chile
    MX: { multiplier: 0.5, currency: 'usd' }, // Mexico
    CO: { multiplier: 0.5, currency: 'usd' }, // Colombia
    AR: { multiplier: 0.4, currency: 'usd' }, // Argentina
    PE: { multiplier: 0.5, currency: 'usd' }, // Peru
    BR: { multiplier: 0.5, currency: 'usd' }, // Brazil
    // Default (full price)
    US: { multiplier: 1, currency: 'usd' },
    DEFAULT: { multiplier: 1, currency: 'usd' },
}

export function getPriceForCountry(basePriceUsd: number, countryCode: string): number {
    const pricing = COUNTRY_PRICING[countryCode] || COUNTRY_PRICING.DEFAULT
    return Math.round(basePriceUsd * pricing.multiplier)
}

export function getPlanById(planId: string): Plan | null {
    return PLANS[planId as PlanId] || null
}

export function checkPlanLimit(
    plan: Plan,
    resource: 'projects' | 'applications' | 'aiTokens',
    currentCount: number
): { allowed: boolean; limit: number; remaining: number } {
    const limitKey = resource === 'projects'
        ? 'maxProjects'
        : resource === 'applications'
            ? 'maxApplications'
            : 'aiTokensPerMonth'

    const limit = plan.limits[limitKey]

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, limit: -1, remaining: -1 }
    }

    const remaining = limit - currentCount
    return {
        allowed: remaining > 0,
        limit,
        remaining: Math.max(0, remaining),
    }
}
