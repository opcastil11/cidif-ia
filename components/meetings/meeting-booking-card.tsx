'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, ArrowRight, Check, DollarSign } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

interface MeetingType {
  id: string
  name: string
  description: string
  duration_minutes: number
  price_usd: number
  is_free: boolean
  user_country?: string
}

interface MeetingBookingCardProps {
  showLoginPrompt?: boolean
  compact?: boolean
}

export function MeetingBookingCard({ showLoginPrompt = false, compact = false }: MeetingBookingCardProps) {
  const t = useTranslations('meetings')
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMeetingTypes() {
      try {
        const res = await fetch('/api/meetings')
        if (res.ok) {
          const data = await res.json()
          setMeetingTypes(data.meetingTypes || [])
        }
      } catch (error) {
        console.error('Error fetching meeting types:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMeetingTypes()
  }, [])

  if (loading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    )
  }

  const introMeeting = meetingTypes.find(m => m.name === 'intro')
  const reviewMeeting = meetingTypes.find(m => m.name === 'review')

  if (compact) {
    return (
      <Card className="bg-card border-border overflow-hidden relative hover-lift">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="font-heading text-foreground">{t('title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2">
            {introMeeting && (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/meetings">
                  <Clock className="mr-2 h-3 w-3" />
                  {t('types.intro.shortName')}
                </Link>
              </Button>
            )}
            {reviewMeeting && (
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link href="/dashboard/meetings">
                  <Calendar className="mr-2 h-3 w-3" />
                  {t('types.review.shortName')}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Intro Meeting Card */}
      {introMeeting && (
        <Card className="bg-card border-border overflow-hidden relative hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="font-heading text-foreground">
                    {t('types.intro.name')}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    {introMeeting.duration_minutes} {t('minutes')}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-0">
                {t('free')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-muted-foreground">
              {t('types.intro.description')}
            </p>
            <ul className="space-y-2">
              {(t.raw('types.intro.features') as string[]).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {showLoginPrompt ? (
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-600/90">
                <Link href="/login">
                  {t('bookNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-600/90">
                <Link href="/dashboard/meetings?type=intro">
                  {t('bookNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Meeting Card */}
      {reviewMeeting && (
        <Card className="bg-card border-primary/50 overflow-hidden relative hover-lift group shadow-lg shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
          <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            {t('recommended')}
          </div>
          <CardHeader className="relative pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="font-heading text-foreground">
                    {t('types.review.name')}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    {reviewMeeting.duration_minutes} {t('minutes')}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-heading font-bold text-foreground">
                  <DollarSign className="h-5 w-5" />
                  {reviewMeeting.price_usd}
                </div>
                <span className="text-xs text-muted-foreground">USD</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-muted-foreground">
              {t('types.review.description')}
            </p>
            <ul className="space-y-2">
              {(t.raw('types.review.features') as string[]).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {showLoginPrompt ? (
              <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link href="/login">
                  {t('bookNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link href="/dashboard/meetings?type=review">
                  {t('bookNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
