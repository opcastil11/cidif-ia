import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { FolderKanban, Plus, Calendar, DollarSign, Globe } from 'lucide-react'

export default async function FundsPage() {
    const supabase = await createClient()

    const { data: funds } = await supabase
        .from('funds')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground">Plantillas de Fondos</h2>
                    <p className="text-muted-foreground">Crear y gestionar templates de postulaciones</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/backoffice/funds/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Fondo
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {funds?.map((fund) => (
                    <Link key={fund.id} href={`/backoffice/funds/${fund.id}`}>
                        <Card className="bg-card border-border hover-lift cursor-pointer h-full">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant={fund.is_active ? 'default' : 'secondary'}>
                                                {fund.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                            <Badge variant="outline">{fund.type}</Badge>
                                        </div>
                                        <h3 className="font-heading text-lg font-semibold text-foreground">
                                            {fund.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{fund.organization}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{fund.country}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">
                                            {fund.amount_min?.toLocaleString()} - {fund.amount_max?.toLocaleString()} {fund.currency}
                                        </span>
                                    </div>
                                    {fund.deadline && (
                                        <div className="flex items-center gap-2 col-span-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-foreground">
                                                Cierre: {new Date(fund.deadline).toLocaleDateString('es-CL')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {(!funds || funds.length === 0) && (
                    <Card className="bg-card border-border col-span-2">
                        <CardContent className="p-12 text-center">
                            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">No hay fondos configurados</p>
                            <Button asChild className="bg-primary hover:bg-primary/90">
                                <Link href="/backoffice/funds/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Primer Fondo
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
