'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Check,
  DollarSign,
  FileText,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { MeetingBooking, MEETING_STATUS_COLORS } from '@/types/meetings'

interface MeetingType {
  id: string
  name: string
  description: string
  duration_minutes: number
  price_usd: number
  is_free: boolean
  user_country?: string
}

interface Project {
  id: string
  name: string
}

export default function MeetingsPage() {
  const t = useTranslations('meetings')
  const tCommon = useTranslations('common')
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [bookings, setBookings] = useState<MeetingBooking[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<MeetingType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Booking form state
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [typesRes, bookingsRes, projectsRes] = await Promise.all([
          fetch('/api/meetings'),
          fetch('/api/meetings/bookings'),
          fetch('/api/projects')
        ])

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setMeetingTypes(typesData.meetingTypes || [])
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings || [])
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.projects || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleBookMeeting = async () => {
    if (!selectedType || !selectedDate || !selectedTime) {
      toast.error(t('errors.missingFields'))
      return
    }

    setBookingLoading(true)
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_type_id: selectedType.id,
          project_id: selectedProject || undefined,
          scheduled_at: scheduledAt,
          notes: notes || undefined
        })
      })

      if (!res.ok) {
        throw new Error('Failed to book meeting')
      }

      const data = await res.json()
      setBookings(prev => [data.booking, ...prev])
      setDialogOpen(false)
      setSelectedType(null)
      setSelectedDate('')
      setSelectedTime('')
      setSelectedProject('')
      setNotes('')
      toast.success(t('success.booked'))
    } catch (error) {
      console.error('Error booking meeting:', error)
      toast.error(t('errors.bookingFailed'))
    } finally {
      setBookingLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'completed':
        return <Check className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const introMeeting = meetingTypes.find(m => m.name === 'intro')
  const reviewMeeting = meetingTypes.find(m => m.name === 'review')

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">{t('pageTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('pageSubtitle')}</p>
      </div>

      {/* Meeting Type Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Intro Meeting Card */}
        {introMeeting && (
          <Card className="bg-card border-border overflow-hidden relative hover-lift group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Video className="h-6 w-6 text-white" />
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
              <Dialog open={dialogOpen && selectedType?.name === 'intro'} onOpenChange={(open) => {
                setDialogOpen(open)
                if (open) setSelectedType(introMeeting)
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-teal-600 hover:bg-teal-600/90">
                    <Calendar className="mr-2 h-4 w-4" />
                    {t('schedule')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('bookingDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('types.intro.name')} - {introMeeting.duration_minutes} {t('minutes')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">{t('bookingDialog.date')}</Label>
                      <Input
                        id="date"
                        type="date"
                        min={minDate}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">{t('bookingDialog.time')}</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bookingDialog.selectTime')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">09:00</SelectItem>
                          <SelectItem value="10:00">10:00</SelectItem>
                          <SelectItem value="11:00">11:00</SelectItem>
                          <SelectItem value="14:00">14:00</SelectItem>
                          <SelectItem value="15:00">15:00</SelectItem>
                          <SelectItem value="16:00">16:00</SelectItem>
                          <SelectItem value="17:00">17:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">{t('bookingDialog.notes')}</Label>
                      <Textarea
                        id="notes"
                        placeholder={t('bookingDialog.notesPlaceholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleBookMeeting}
                      disabled={bookingLoading || !selectedDate || !selectedTime}
                    >
                      {bookingLoading ? t('booking') : t('confirmBooking')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
              <Dialog open={dialogOpen && selectedType?.name === 'review'} onOpenChange={(open) => {
                setDialogOpen(open)
                if (open) setSelectedType(reviewMeeting)
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Calendar className="mr-2 h-4 w-4" />
                    {t('schedule')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('bookingDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('types.review.name')} - {reviewMeeting.duration_minutes} {t('minutes')} - ${reviewMeeting.price_usd} USD
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="project">{t('bookingDialog.project')}</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bookingDialog.selectProject')} />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">{t('bookingDialog.date')}</Label>
                      <Input
                        id="date"
                        type="date"
                        min={minDate}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">{t('bookingDialog.time')}</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bookingDialog.selectTime')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">09:00</SelectItem>
                          <SelectItem value="10:00">10:00</SelectItem>
                          <SelectItem value="11:00">11:00</SelectItem>
                          <SelectItem value="14:00">14:00</SelectItem>
                          <SelectItem value="15:00">15:00</SelectItem>
                          <SelectItem value="16:00">16:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">{t('bookingDialog.notes')}</Label>
                      <Textarea
                        id="notes"
                        placeholder={t('bookingDialog.notesPlaceholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('bookingDialog.total')}</span>
                        <span className="font-semibold">${reviewMeeting.price_usd} USD</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleBookMeeting}
                      disabled={bookingLoading || !selectedDate || !selectedTime}
                    >
                      {bookingLoading ? t('booking') : t('confirmBooking')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Bookings */}
      {bookings.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-heading text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('myBookings')}
            </CardTitle>
            <CardDescription>{t('myBookingsSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => {
                const statusColors = MEETING_STATUS_COLORS[booking.status] || MEETING_STATUS_COLORS.pending
                const meetingType = booking.meeting_type
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full ${statusColors.bg} flex items-center justify-center`}>
                        <span className={statusColors.text}>
                          {getStatusIcon(booking.status)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {meetingType?.name === 'intro' ? t('types.intro.name') : t('types.review.name')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.scheduled_at), 'PPP')} - {format(new Date(booking.scheduled_at), 'p')}
                        </p>
                        {booking.project && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('project')}: {(booking.project as { name: string }).name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {booking.price_usd > 0 && (
                        <span className="text-sm font-medium">${booking.price_usd} USD</span>
                      )}
                      <Badge className={`${statusColors.bg} ${statusColors.text} border-0`}>
                        {t(`status.${booking.status}`)}
                      </Badge>
                      {booking.report_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={booking.report_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-3 w-3" />
                            {t('viewReport')}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
