import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FolderKanban, Users, Calendar, DollarSign, Rocket, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export default async function ProjectsPage() {
    const t = await getTranslations('projects')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
                    <p className="text-slate-400 mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                        <Link href="/dashboard/projects/create-with-ai">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t('createWithAI')}
                        </Link>
                    </Button>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link href="/dashboard/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('newProject')}
                        </Link>
                    </Button>
                </div>
            </div>

            {projects && projects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {projects.map((project) => (
                        <Card key={project.id} className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-colors h-full">
                            <CardContent className="p-6">
                                <Link href={`/dashboard/projects/${project.id}`} className="block">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors">{project.name}</h3>
                                            {project.industry && (
                                                <Badge variant="secondary" className="mt-1 bg-slate-800 text-slate-300">
                                                    {project.industry}
                                                </Badge>
                                            )}
                                        </div>
                                        {project.stage && (
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                                {project.stage}
                                            </Badge>
                                        )}
                                    </div>
                                    {project.description && (
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                                            {project.description}
                                        </p>
                                    )}
                                </Link>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        {project.team_size && (
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{project.team_size}</span>
                                            </div>
                                        )}
                                        {project.annual_revenue && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                <span>${Number(project.annual_revenue).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {project.founded_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(project.founded_date).getFullYear()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
                                        <Link href={`/dashboard/funds?project=${project.id}`}>
                                            <Rocket className="mr-2 h-4 w-4" />
                                            {t('quickApply')}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-900 border-slate-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <FolderKanban className="h-8 w-8 text-slate-500" />
                        </div>
                        <CardTitle className="text-white mb-2">{t('empty.title')}</CardTitle>
                        <p className="text-slate-400 text-center max-w-sm mb-6">
                            {t('empty.description')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                <Link href="/dashboard/projects/create-with-ai">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {t('createWithAI')}
                                </Link>
                            </Button>
                            <span className="text-slate-500 text-sm">{t('empty.or')}</span>
                            <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                                <Link href="/dashboard/projects/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('empty.action')}
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
