'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Sparkles, ArrowUpRight, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SubscriptionCardProps {
    currentPlan: string
    status: string
    periodEnd?: string
}

export function SubscriptionCard({ currentPlan, status, periodEnd }: SubscriptionCardProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const t = useTranslations('subscription')

    const handleSubscribe = async (planId: string) => {
        setLoading(planId)
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    successUrl: window.location.origin + '/dashboard?subscription=success',
                    cancelUrl: window.location.origin + '/dashboard/profile',
                }),
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Checkout error:', error)
        } finally {
            setLoading(null)
        }
    }

    const handleManageSubscription = async () => {
        setLoading('portal')
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
            setLoading(null)
        }
    }

    const isPaid = currentPlan !== 'free' && status === 'active'

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <CreditCard className="h-5 w-5" />
                    {t('title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('currentPlan')}</p>
                        <p className="text-xl font-heading font-bold text-foreground capitalize">
                            {currentPlan}
                        </p>
                        {periodEnd && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('renewsOn')} {new Date(periodEnd).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <Badge
                        variant={status === 'active' ? 'default' : 'destructive'}
                        className={status === 'active' ? 'bg-primary' : ''}
                    >
                        {status === 'active' ? t('active') : status}
                    </Badge>
                </div>

                {/* Upgrade Options */}
                {currentPlan === 'free' && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{t('upgradePrompt')}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Button
                                onClick={() => handleSubscribe('standard')}
                                disabled={loading !== null}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {loading === 'standard' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Standard - $50/mes
                            </Button>
                            <Button
                                onClick={() => handleSubscribe('max')}
                                disabled={loading !== null}
                                variant="outline"
                            >
                                {loading === 'max' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowUpRight className="mr-2 h-4 w-4" />
                                )}
                                Max - $100/mes
                            </Button>
                        </div>
                    </div>
                )}

                {currentPlan === 'standard' && (
                    <div className="space-y-3">
                        <Button
                            onClick={() => handleSubscribe('max')}
                            disabled={loading !== null}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            {loading === 'max' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowUpRight className="mr-2 h-4 w-4" />
                            )}
                            {t('upgradeTo')} Max - $100/mes
                        </Button>
                    </div>
                )}

                {/* Manage Subscription */}
                {isPaid && (
                    <Button
                        onClick={handleManageSubscription}
                        disabled={loading !== null}
                        variant="outline"
                        className="w-full"
                    >
                        {loading === 'portal' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        {t('manageSubscription')}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
