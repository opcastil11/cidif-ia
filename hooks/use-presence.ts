'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
    id: string
    email: string | null
    online_at: string
}

interface UsePresenceOptions {
    roomName?: string
}

export function usePresence(userId: string, userEmail: string | null, options: UsePresenceOptions = {}) {
    const { roomName = 'online-users' } = options
    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([])
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)

    const syncPresence = useCallback((state: Record<string, PresenceState[]>) => {
        const users: PresenceState[] = []
        for (const presences of Object.values(state)) {
            for (const presence of presences) {
                users.push(presence)
            }
        }
        // Remove duplicates by user id
        const uniqueUsers = Array.from(
            new Map(users.map(u => [u.id, u])).values()
        )
        setOnlineUsers(uniqueUsers)
    }, [])

    useEffect(() => {
        if (!userId) return

        const supabase = createClient()
        const presenceChannel = supabase.channel(roomName, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState<PresenceState>()
                syncPresence(state)
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                setOnlineUsers(prev => {
                    const typedNewPresences = newPresences as unknown as PresenceState[]
                    const newUsers = typedNewPresences.filter(
                        (p) => !prev.some(u => u.id === p.id)
                    )
                    return [...prev, ...newUsers]
                })
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                const typedLeftPresences = leftPresences as unknown as PresenceState[]
                setOnlineUsers(prev =>
                    prev.filter(u => !typedLeftPresences.some((p) => p.id === u.id))
                )
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        id: userId,
                        email: userEmail,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        setChannel(presenceChannel)

        return () => {
            presenceChannel.unsubscribe()
        }
    }, [userId, userEmail, roomName, syncPresence])

    return {
        onlineUsers,
        onlineCount: onlineUsers.length,
        isConnected: channel !== null,
    }
}
