import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FolderKanban } from 'lucide-react'
import Link from 'next/link'

export default function ProjectsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Projects</h1>
                    <p className="text-slate-400 mt-1">Manage your projects and companies</p>
                </div>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/dashboard/projects/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Link>
                </Button>
            </div>

            {/* Empty state */}
            <Card className="bg-slate-900 border-slate-800 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                        <FolderKanban className="h-8 w-8 text-slate-500" />
                    </div>
                    <CardTitle className="text-white mb-2">No projects yet</CardTitle>
                    <p className="text-slate-400 text-center max-w-sm mb-4">
                        Create your first project to start applying for funds.
                    </p>
                    <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                        <Link href="/dashboard/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Project
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
