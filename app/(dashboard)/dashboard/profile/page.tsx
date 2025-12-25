import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
                <h1 className="text-3xl font-bold text-white">Profile</h1>
                <p className="text-slate-400 mt-1">Manage your account settings</p>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-white text-2xl">
                                {profile?.full_name || 'User'}
                            </CardTitle>
                            <p className="text-slate-400">{user?.email}</p>
                            <Badge className="mt-2 bg-purple-600/20 text-purple-400 border-purple-500/30">
                                {profile?.subscription_tier || 'Free'} Plan
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm text-slate-400">Company</label>
                            <p className="text-white">{profile?.company_name || 'Not set'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400">Country</label>
                            <p className="text-white">{profile?.country || 'Not set'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400">Phone</label>
                            <p className="text-white">{profile?.phone || 'Not set'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400">RUT/Tax ID</label>
                            <p className="text-white">{profile?.rut_empresa || 'Not set'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
