'use client'

import { usePresence } from '@/hooks/use-presence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ConnectedUsersProps {
    userId: string
    userEmail: string | null
}

export function ConnectedUsersCard({ userId, userEmail }: ConnectedUsersProps) {
    const t = useTranslations('backoffice')
    const { onlineCount, isConnected } = usePresence(userId, userEmail)

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('stats.connectedUsers')}
                </CardTitle>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <div className="text-3xl font-heading font-bold text-foreground">
                        {onlineCount}
                    </div>
                    {isConnected && (
                        <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {t('stats.connectedNow')}
                </p>
            </CardContent>
        </Card>
    )
}

export function ConnectedUsersList({ userId, userEmail }: ConnectedUsersProps) {
    const t = useTranslations('backoffice')
    const { onlineUsers, onlineCount } = usePresence(userId, userEmail)

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                    </div>
                    {t('stats.connectedUsers')}
                    <span className="text-sm font-normal text-muted-foreground">
                        ({onlineCount})
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {onlineUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('stats.noUsersOnline')}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {onlineUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-800/50"
                            >
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span className="text-sm text-foreground truncate">
                                    {user.email || t('stats.anonymousUser')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
