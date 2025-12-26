import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, FolderKanban, FileText, CreditCard } from 'lucide-react'

export default async function UsersPage() {
    const supabase = await createClient()

    // Fetch all users with their project and application counts
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    // Get project counts per user
    const { data: projectCounts } = await supabase
        .from('projects')
        .select('user_id')

    // Get application counts per user
    const { data: applicationCounts } = await supabase
        .from('applications')
        .select('user_id')

    // Count projects and applications per user
    const userProjectCounts: Record<string, number> = {}
    const userAppCounts: Record<string, number> = {}

    projectCounts?.forEach(p => {
        userProjectCounts[p.user_id] = (userProjectCounts[p.user_id] || 0) + 1
    })

    applicationCounts?.forEach(a => {
        userAppCounts[a.user_id] = (userAppCounts[a.user_id] || 0) + 1
    })

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'max': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            case 'standard': return 'bg-primary/20 text-primary border-primary/30'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            case 'past_due': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground">Usuarios</h2>
                    <p className="text-muted-foreground">Gestión de usuarios y suscripciones</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    <Users className="h-4 w-4 mr-2" />
                    {profiles?.length || 0} usuarios
                </Badge>
            </div>

            <div className="space-y-4">
                {profiles?.map((profile) => {
                    const initials = profile.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'

                    return (
                        <Card key={profile.id} className="bg-card border-border">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={profile.avatar_url || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-semibold text-foreground">
                                                {profile.full_name || 'Sin nombre'}
                                            </h3>
                                            <Badge className={getPlanBadgeColor(profile.subscription_tier || 'free')}>
                                                {(profile.subscription_tier || 'free').toUpperCase()}
                                            </Badge>
                                            <Badge className={getStatusBadgeColor(profile.subscription_status || 'active')}>
                                                {profile.subscription_status || 'active'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                                        {profile.company_name && (
                                            <p className="text-sm text-muted-foreground">{profile.company_name}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-foreground font-medium">
                                                {userProjectCounts[profile.id] || 0}
                                            </span>
                                            <span className="text-muted-foreground">proyectos</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-foreground font-medium">
                                                {userAppCounts[profile.id] || 0}
                                            </span>
                                            <span className="text-muted-foreground">postulaciones</span>
                                        </div>
                                        {profile.stripe_customer_id && (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                <span className="text-muted-foreground">Stripe</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">País:</span>
                                        <span className="ml-2 text-foreground">{profile.country || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Teléfono:</span>
                                        <span className="ml-2 text-foreground">{profile.phone || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">RUT:</span>
                                        <span className="ml-2 text-foreground">{profile.rut_empresa || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Registro:</span>
                                        <span className="ml-2 text-foreground">
                                            {new Date(profile.created_at).toLocaleDateString('es-CL')}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {(!profiles || profiles.length === 0) && (
                    <Card className="bg-card border-border">
                        <CardContent className="p-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay usuarios registrados</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
