import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getTranslations } from 'next-intl/server'
import { SubscriptionCard } from '@/components/dashboard/subscription-card'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const t = await getTranslations('profile')
    const tCommon = await getTranslations('common')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const initials = profile?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || user?.email?.[0].toUpperCase() || 'U'

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-heading text-foreground">{t('title')}</h1>
                <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-foreground text-2xl">
                                    {profile?.full_name || 'User'}
                                </CardTitle>
                                <p className="text-muted-foreground">{user?.email}</p>
                                <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
                                    {profile?.subscription_tier || 'Free'} {tCommon('plan')}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm text-muted-foreground">{t('company')}</label>
                                <p className="text-foreground">{profile?.company_name || tCommon('notSet')}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">{t('country')}</label>
                                <p className="text-foreground">{profile?.country || tCommon('notSet')}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">{t('phone')}</label>
                                <p className="text-foreground">{profile?.phone || tCommon('notSet')}</p>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">{t('taxId')}</label>
                                <p className="text-foreground">{profile?.rut_empresa || tCommon('notSet')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <SubscriptionCard
                    currentPlan={profile?.subscription_tier || 'free'}
                    status={profile?.subscription_status || 'active'}
                    periodEnd={profile?.subscription_period_end}
                />
            </div>
        </div>
    )
}
