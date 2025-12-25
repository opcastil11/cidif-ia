import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ApplicationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Applications</h1>
                    <p className="text-slate-400 mt-1">Track your fund applications</p>
                </div>
            </div>

            {/* Empty state */}
            <Card className="bg-slate-900 border-slate-800 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-slate-500" />
                    </div>
                    <CardTitle className="text-white mb-2">No applications yet</CardTitle>
                    <p className="text-slate-400 text-center max-w-sm mb-4">
                        Browse available funds and start your first application.
                    </p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link href="/dashboard/funds">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Browse Funds
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
