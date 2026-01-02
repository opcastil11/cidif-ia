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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { COUNTRY_NAMES, MEETING_STATUS_COLORS } from '@/types/meetings'

interface MeetingType {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  base_price_usd: number
  is_free: boolean
  is_active: boolean
}

interface MeetingPricing {
  id: string
  meeting_type_id: string
  country_code: string
  price_usd: number
}

interface MeetingBooking {
  id: string
  user_id: string
  meeting_type_id: string | null
  project_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  price_usd: number
  country_code: string | null
  notes: string | null
  admin_notes: string | null
  report_url: string | null
  created_at: string
  user?: {
    email: string
    full_name: string | null
    company_name: string | null
  }
  meeting_type?: MeetingType
  project?: {
    name: string
  }
}

export default function BackofficeMeetingsPage() {
  const t = useTranslations('backoffice.meetings')
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [pricing, setPricing] = useState<MeetingPricing[]>([])
  const [bookings, setBookings] = useState<MeetingBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<MeetingBooking | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
  const [editingPricing, setEditingPricing] = useState<{
    meetingTypeId: string
    countryCode: string
    price: number
  } | null>(null)

  // Form states
  const [adminNotes, setAdminNotes] = useState('')
  const [reportUrl, setReportUrl] = useState('')
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [typesRes, pricingRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/meetings/types'),
        fetch('/api/admin/meetings/pricing'),
        fetch('/api/admin/meetings/bookings')
      ])

      if (typesRes.ok) {
        const data = await typesRes.json()
        setMeetingTypes(data.meetingTypes || [])
      }

      if (pricingRes.ok) {
        const data = await pricingRes.json()
        setPricing(data.pricing || [])
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(t('errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function updateBooking() {
    if (!selectedBooking) return

    try {
      const res = await fetch(`/api/admin/meetings/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus || selectedBooking.status,
          admin_notes: adminNotes,
          report_url: reportUrl
        })
      })

      if (!res.ok) throw new Error('Failed to update booking')

      toast.success(t('success.bookingUpdated'))
      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error(t('errors.updateFailed'))
    }
  }

  async function updatePricing() {
    if (!editingPricing) return

    try {
      const res = await fetch('/api/admin/meetings/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_type_id: editingPricing.meetingTypeId,
          country_code: editingPricing.countryCode,
          price_usd: editingPricing.price
        })
      })

      if (!res.ok) throw new Error('Failed to update pricing')

      toast.success(t('success.pricingUpdated'))
      setPricingDialogOpen(false)
      setEditingPricing(null)
      fetchData()
    } catch (error) {
      console.error('Error updating pricing:', error)
      toast.error(t('errors.updateFailed'))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getCountryPrice = (meetingTypeId: string, countryCode: string): number | null => {
    const p = pricing.find(
      pr => pr.meeting_type_id === meetingTypeId && pr.country_code === countryCode
    )
    return p?.price_usd ?? null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // Stats
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.price_usd, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.total')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.pending')}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.completed')}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBookings}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">
            <Calendar className="mr-2 h-4 w-4" />
            {t('tabs.bookings')}
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="mr-2 h-4 w-4" />
            {t('tabs.pricing')}
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-heading text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('bookings.title')}
              </CardTitle>
              <CardDescription>{t('bookings.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bookings.table.date')}</TableHead>
                    <TableHead>{t('bookings.table.customer')}</TableHead>
                    <TableHead>{t('bookings.table.type')}</TableHead>
                    <TableHead>{t('bookings.table.project')}</TableHead>
                    <TableHead>{t('bookings.table.price')}</TableHead>
                    <TableHead>{t('bookings.table.status')}</TableHead>
                    <TableHead>{t('bookings.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const statusColors = MEETING_STATUS_COLORS[booking.status] || MEETING_STATUS_COLORS.pending
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(booking.scheduled_at), 'PPP')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(booking.scheduled_at), 'p')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.user?.full_name || booking.user?.email}
                            </div>
                            {booking.user?.company_name && (
                              <div className="text-sm text-muted-foreground">
                                {booking.user.company_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {booking.meeting_type?.name === 'intro' ? t('types.intro') : t('types.review')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.project?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {booking.price_usd > 0 ? `$${booking.price_usd}` : t('free')}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors.bg} ${statusColors.text} border-0`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{t(`status.${booking.status}`)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                            setDialogOpen(open)
                            if (open) {
                              setSelectedBooking(booking)
                              setAdminNotes(booking.admin_notes || '')
                              setReportUrl(booking.report_url || '')
                              setNewStatus(booking.status)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Pencil className="h-3 w-3 mr-1" />
                                {t('bookings.manage')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('bookings.manageDialog.title')}</DialogTitle>
                                <DialogDescription>
                                  {booking.user?.full_name || booking.user?.email} - {format(new Date(booking.scheduled_at), 'PPP p')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>{t('bookings.manageDialog.status')}</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">{t('status.pending')}</SelectItem>
                                      <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
                                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                                      <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('bookings.manageDialog.adminNotes')}</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder={t('bookings.manageDialog.adminNotesPlaceholder')}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t('bookings.manageDialog.reportUrl')}</Label>
                                  <Input
                                    value={reportUrl}
                                    onChange={(e) => setReportUrl(e.target.value)}
                                    placeholder="https://..."
                                  />
                                </div>
                                {booking.notes && (
                                  <div className="p-3 rounded-lg bg-muted">
                                    <Label className="text-xs text-muted-foreground">{t('bookings.manageDialog.customerNotes')}</Label>
                                    <p className="text-sm mt-1">{booking.notes}</p>
                                  </div>
                                )}
                                <Button className="w-full" onClick={updateBooking}>
                                  {t('bookings.manageDialog.save')}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('bookings.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-foreground flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {t('pricing.title')}
                  </CardTitle>
                  <CardDescription>{t('pricing.subtitle')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {meetingTypes.map((type) => (
                  <div key={type.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {type.name === 'intro' ? t('types.intro') : t('types.review')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {type.duration_minutes} {t('minutes')} | {t('pricing.basePrice')}: ${type.base_price_usd}
                        </p>
                      </div>
                      <Badge variant={type.is_free ? 'secondary' : 'default'}>
                        {type.is_free ? t('free') : t('paid')}
                      </Badge>
                    </div>

                    {!type.is_free && (
                      <div className="grid gap-3 md:grid-cols-4">
                        {Object.entries(COUNTRY_NAMES).map(([code, name]) => {
                          const price = getCountryPrice(type.id, code)
                          return (
                            <div
                              key={code}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer"
                              onClick={() => {
                                setEditingPricing({
                                  meetingTypeId: type.id,
                                  countryCode: code,
                                  price: price || type.base_price_usd
                                })
                                setPricingDialogOpen(true)
                              }}
                            >
                              <span className="text-sm font-medium">{name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">
                                  ${price ?? type.base_price_usd}
                                </span>
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing Edit Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pricing.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {editingPricing && COUNTRY_NAMES[editingPricing.countryCode]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('pricing.editDialog.price')}</Label>
              <Input
                type="number"
                value={editingPricing?.price || 0}
                onChange={(e) => setEditingPricing(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                min={0}
                step={5}
              />
            </div>
            <Button className="w-full" onClick={updatePricing}>
              {t('pricing.editDialog.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
