'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Check, Loader2, CreditCard, Crown, Zap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Profile {
  subscription_tier: string
  subscription_status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_ends_at: string | null
  country: string | null
}

const PLANS = [
  {
    id: 'free',
    icon: Zap,
    price: 0,
    popular: false,
  },
  {
    id: 'standard',
    icon: Sparkles,
    price: 1,
    popular: true,
  },
  {
    id: 'max',
    icon: Crown,
    price: 100,
    popular: false,
  },
]

// Country-based pricing multipliers
const COUNTRY_PRICING: Record<string, number> = {
  CL: 0.6,
  MX: 0.5,
  CO: 0.5,
  AR: 0.4,
  PE: 0.5,
  BR: 0.5,
  US: 1,
  DEFAULT: 1,
}

export default function BillingPage() {
  const t = useTranslations('billing')
  const tPricing = useTranslations('home.pricing')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_ends_at, country')
        .eq('id', user.id)
        .single()

      setProfile(data)
    }
    setLoading(false)
  }

  const getAdjustedPrice = (basePrice: number) => {
    const multiplier = COUNTRY_PRICING[profile?.country || 'DEFAULT'] || COUNTRY_PRICING.DEFAULT
    return Math.round(basePrice * multiplier)
  }

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return

    setCheckoutLoading(planId)
    try {
      // Get current locale from URL
      const pathLocale = window.location.pathname.split('/')[1]
      const locale = ['en', 'es'].includes(pathLocale) ? pathLocale : 'es'

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          locale,
          successUrl: `${window.location.origin}/${locale}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/${locale}/dashboard/billing?cancelled=true`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Checkout error:', data)
        const errorMsg = data.error || 'Error creating checkout session'
        const errorCode = data.code ? ` (${data.code})` : ''
        alert(`${errorMsg}${errorCode}`)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned:', data)
        alert('Error: No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error connecting to payment service')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  const currentPlan = profile?.subscription_tier || 'free'
  const isActive = profile?.subscription_status === 'active'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="text-slate-400 mt-1">{t('subtitle')}</p>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-400" />
            {t('currentPlan')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {currentPlan === 'max' && <Crown className="h-6 w-6 text-white" />}
                {currentPlan === 'standard' && <Sparkles className="h-6 w-6 text-white" />}
                {currentPlan === 'free' && <Zap className="h-6 w-6 text-white" />}
              </div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {tPricing(`${currentPlan}.name`)}
                </p>
                <p className="text-slate-400 text-sm">
                  {tPricing(`${currentPlan}.description`)}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isActive && currentPlan !== 'free' ? (
                <>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-2">
                    {t('active')}
                  </Badge>
                  {profile?.subscription_ends_at && (
                    <p className="text-slate-500 text-sm">
                      {t('renewsOn')} {new Date(profile.subscription_ends_at).toLocaleDateString()}
                    </p>
                  )}
                </>
              ) : (
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {t('freePlan')}
                </Badge>
              )}
            </div>
          </div>

          {/* Manage Subscription Button */}
          {profile?.stripe_subscription_id && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {t('manageSubscription')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">{t('availablePlans')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id
            const adjustedPrice = getAdjustedPrice(plan.price)
            const PlanIcon = plan.icon

            // Get features from translations
            const features = tPricing.raw(`${plan.id}.features`) as string[]

            return (
              <Card
                key={plan.id}
                className={cn(
                  'bg-slate-900 border-slate-800 relative overflow-hidden',
                  plan.popular && 'border-purple-500/50 ring-1 ring-purple-500/20',
                  isCurrentPlan && 'border-green-500/50 ring-1 ring-green-500/20'
                )}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                    {tPricing('popular')}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                    {tPricing('currentPlan')}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      plan.id === 'free' && 'bg-slate-800',
                      plan.id === 'standard' && 'bg-purple-500/20',
                      plan.id === 'max' && 'bg-gradient-to-br from-purple-500 to-pink-500'
                    )}>
                      <PlanIcon className={cn(
                        'h-5 w-5',
                        plan.id === 'free' && 'text-slate-400',
                        plan.id === 'standard' && 'text-purple-400',
                        plan.id === 'max' && 'text-white'
                      )} />
                    </div>
                    <CardTitle className="text-white">
                      {tPricing(`${plan.id}.name`)}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-400">
                    {tPricing(`${plan.id}.description`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <span className="text-4xl font-bold text-white">
                      ${adjustedPrice}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-400 ml-1">/{tPricing('monthly')}</span>
                    )}
                    {plan.price > 0 && adjustedPrice < plan.price && (
                      <p className="text-sm text-green-400 mt-1">
                        {t('regionalDiscount')}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || checkoutLoading === plan.id}
                    className={cn(
                      'w-full',
                      plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    )}
                  >
                    {checkoutLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      t('currentPlanButton')
                    ) : plan.id === 'free' ? (
                      tPricing('getStarted')
                    ) : (
                      tPricing('subscribe')
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* FAQ or Help */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{t('needHelp')}</p>
              <p className="text-slate-400 text-sm">{t('contactSupport')}</p>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300" asChild>
              <a href="mailto:soporte@cidif.tech">{t('contactUs')}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
