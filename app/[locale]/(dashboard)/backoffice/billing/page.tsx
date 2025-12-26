import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    CreditCard,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react'
import { PLANS } from '@/lib/stripe'

interface SubscriptionMetrics {
    totalRevenue: number
    mrr: number
    activeSubscriptions: number
    cancelledSubscriptions: number
    usersByPlan: Record<string, number>
    recentTransactions: {
        userId: string
        email: string
        plan: string
        amount: number
        date: string
        status: string
    }[]
}

async function getMetrics(): Promise<SubscriptionMetrics> {
    const supabase = await createClient()

    // Get all profiles with subscription data
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, subscription_tier, subscription_status, subscription_period_start, subscription_period_end, stripe_customer_id')
        .order('subscription_period_start', { ascending: false })

    // Count users by plan
    const usersByPlan: Record<string, number> = {
        free: 0,
        standard: 0,
        max: 0,
    }

    let activeSubscriptions = 0
    let cancelledSubscriptions = 0

    profiles?.forEach(profile => {
        const plan = profile.subscription_tier || 'free'
        usersByPlan[plan] = (usersByPlan[plan] || 0) + 1

        if (profile.subscription_status === 'active' && plan !== 'free') {
            activeSubscriptions++
        } else if (profile.subscription_status === 'cancelled') {
            cancelledSubscriptions++
        }
    })

    // Calculate MRR
    const mrr = (usersByPlan.standard * PLANS.standard.price) + (usersByPlan.max * PLANS.max.price)

    // Annualized revenue
    const totalRevenue = mrr * 12

    // Get recent subscription activity (mock recent transactions based on subscription data)
    const recentTransactions = profiles
        ?.filter(p => p.subscription_tier && p.subscription_tier !== 'free' && p.subscription_period_start)
        .slice(0, 10)
        .map(p => ({
            userId: p.id,
            email: p.email || 'N/A',
            plan: p.subscription_tier || 'free',
            amount: PLANS[p.subscription_tier as keyof typeof PLANS]?.price || 0,
            date: p.subscription_period_start || '',
            status: p.subscription_status || 'unknown',
        })) || []

    return {
        totalRevenue,
        mrr,
        activeSubscriptions,
        cancelledSubscriptions,
        usersByPlan,
        recentTransactions,
    }
}

export default async function BillingPage() {
    const metrics = await getMetrics()

    const statCards = [
        {
            title: 'MRR',
            value: `$${metrics.mrr.toLocaleString()}`,
            description: 'Ingreso mensual recurrente',
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            title: 'ARR',
            value: `$${metrics.totalRevenue.toLocaleString()}`,
            description: 'Ingreso anual proyectado',
            icon: DollarSign,
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            title: 'Suscripciones Activas',
            value: metrics.activeSubscriptions,
            description: 'Planes pagados activos',
            icon: CreditCard,
            gradient: 'from-orange-500 to-rose-500',
        },
        {
            title: 'Cancelaciones',
            value: metrics.cancelledSubscriptions,
            description: 'Suscripciones canceladas',
            icon: Users,
            gradient: 'from-red-500 to-pink-500',
        },
    ]

    const planColors: Record<string, string> = {
        free: 'bg-muted text-muted-foreground',
        standard: 'bg-primary/20 text-primary',
        max: 'bg-orange-500/20 text-orange-400',
    }

    const statusColors: Record<string, { color: string; icon: typeof ArrowUpRight }> = {
        active: { color: 'text-emerald-400', icon: ArrowUpRight },
        cancelled: { color: 'text-red-400', icon: ArrowDownRight },
        past_due: { color: 'text-yellow-400', icon: Minus },
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Métricas de Facturación</h2>
                <p className="text-muted-foreground">Dashboard de suscripciones y pagos Stripe</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-heading font-bold text-foreground">
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Plan Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Distribución por Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(PLANS).map(([key, plan]) => {
                            const count = metrics.usersByPlan[key] || 0
                            const totalUsers = Object.values(metrics.usersByPlan).reduce((a, b) => a + b, 0)
                            const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0

                            return (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className={planColors[key]}>
                                                {plan.name}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ${plan.price}/mes
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            {count} usuarios ({percentage}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${
                                                key === 'max' ? 'from-orange-500 to-rose-500' :
                                                key === 'standard' ? 'from-primary to-accent' :
                                                'from-muted-foreground to-muted-foreground'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Proyección de Ingresos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Standard</p>
                                <p className="text-2xl font-bold text-foreground">
                                    ${(metrics.usersByPlan.standard || 0) * PLANS.standard.price}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.usersByPlan.standard || 0} × ${PLANS.standard.price}/mes
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Max</p>
                                <p className="text-2xl font-bold text-foreground">
                                    ${(metrics.usersByPlan.max || 0) * PLANS.max.price}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {metrics.usersByPlan.max || 0} × ${PLANS.max.price}/mes
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total MRR</span>
                                <span className="text-xl font-bold text-foreground">${metrics.mrr}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-muted-foreground">Proyección Anual</span>
                                <span className="text-xl font-bold text-primary">${metrics.mrr * 12}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Actividad Reciente de Suscripciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {metrics.recentTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {metrics.recentTransactions.map((tx, index) => {
                                const statusConfig = statusColors[tx.status] || statusColors.active
                                const StatusIcon = statusConfig.icon

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${planColors[tx.plan]}`}>
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{tx.email}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Plan {tx.plan.charAt(0).toUpperCase() + tx.plan.slice(1)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">${tx.amount}/mes</span>
                                                <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {tx.date ? new Date(tx.date).toLocaleDateString('es-CL') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay suscripciones activas aún</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
