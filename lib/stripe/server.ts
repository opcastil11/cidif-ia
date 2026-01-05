import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors when key is missing
let _stripe: Stripe | null = null

/**
 * Get the Stripe server instance.
 * Use this in API routes and server components.
 */
export function getStripeServer(): Stripe {
    if (!_stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY
        if (!secretKey) {
            throw new Error(
                'STRIPE_SECRET_KEY is not set. Please add it to your environment variables.'
            )
        }
        _stripe = new Stripe(secretKey, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        })
    }
    return _stripe
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
        throw new Error(
            'STRIPE_WEBHOOK_SECRET is not set. Please add it to your environment variables.'
        )
    }
    return getStripeServer().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
    )
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(params: {
    priceId: string
    customerId?: string
    customerEmail?: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeServer()

    return stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: params.priceId,
                quantity: 1,
            },
        ],
        customer: params.customerId,
        customer_email: params.customerId ? undefined : params.customerEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        subscription_data: {
            metadata: params.metadata,
        },
    })
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(params: {
    customerId: string
    returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
    const stripe = getStripeServer()

    return stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
    })
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(params: {
    userId: string
    email: string
    name?: string
}): Promise<Stripe.Customer> {
    const stripe = getStripeServer()

    // Search for existing customer by metadata
    const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1,
    })

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]
    }

    // Create new customer
    return stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
            userId: params.userId,
        },
    })
}

/**
 * Get subscription status for a customer
 */
export async function getSubscriptionStatus(
    customerId: string
): Promise<{
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none'
    subscription: Stripe.Subscription | null
    currentPeriodEnd: Date | null
}> {
    const stripe = getStripeServer()

    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1,
    })

    if (subscriptions.data.length === 0) {
        return { status: 'none', subscription: null, currentPeriodEnd: null }
    }

    const subscription = subscriptions.data[0]
    const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'

    // Get current period end from the first subscription item
    const firstItem = subscription.items?.data?.[0]
    const periodEnd = firstItem?.current_period_end

    return {
        status,
        subscription,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
    const stripe = getStripeServer()

    if (cancelAtPeriodEnd) {
        return stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        })
    }

    return stripe.subscriptions.cancel(subscriptionId)
}
