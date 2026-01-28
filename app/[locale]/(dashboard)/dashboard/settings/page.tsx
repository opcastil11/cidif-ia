import { redirect } from 'next/navigation'

// Redirect settings to profile page (which contains account settings)
export default function SettingsPage() {
    redirect('/dashboard/profile')
}
