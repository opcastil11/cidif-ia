export interface MeetingType {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  base_price_usd: number
  is_free: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MeetingPricing {
  id: string
  meeting_type_id: string
  country_code: string
  price_usd: number
  created_at: string
  updated_at: string
}

export interface MeetingBooking {
  id: string
  user_id: string
  meeting_type_id: string | null
  project_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price_usd: number
  country_code: string | null
  notes: string | null
  admin_notes: string | null
  report_url: string | null
  calendar_event_id: string | null
  created_at: string
  updated_at: string
  // Joined relations
  meeting_type?: MeetingType
  user?: {
    id: string
    email: string
    full_name: string | null
    company_name: string | null
  }
  project?: {
    id: string
    name: string
  }
}

export interface BookMeetingRequest {
  meeting_type_id: string
  project_id?: string
  scheduled_at: string
  notes?: string
}

export const COUNTRY_NAMES: Record<string, string> = {
  PE: 'Peru',
  CL: 'Chile',
  MX: 'Mexico',
  CO: 'Colombia',
  AR: 'Argentina',
  BR: 'Brazil',
  US: 'United States',
  DEFAULT: 'Default'
}

export const MEETING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600' },
  confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
  completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' }
}
