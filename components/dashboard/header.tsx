'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/routing'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, LogOut, Menu, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
    user: SupabaseUser
    profile: {
        full_name?: string
        avatar_url?: string
        email: string
    } | null
}

export function Header({ user, profile }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const t = useTranslations('common')

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const initials = profile?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || user.email?.[0].toUpperCase() || 'U'

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
                type="button"
                className="lg:hidden -m-2.5 p-2.5 text-slate-400 hover:text-white"
            >
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-800 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex-1" />

                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <Bell className="h-5 w-5" />
                    </Button>

                    {/* Separator */}
                    <div
                        className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800"
                        aria-hidden="true"
                    />

                    {/* Profile dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-3 hover:bg-slate-800 px-2"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden lg:flex lg:items-center">
                                    <span className="text-sm font-medium text-white">
                                        {profile?.full_name || user.email}
                                    </span>
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-slate-900 border-slate-800"
                        >
                            <DropdownMenuLabel className="text-slate-400">
                                {user.email}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem
                                className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer"
                                onClick={() => router.push('/dashboard/profile')}
                            >
                                <User className="mr-2 h-4 w-4" />
                                {t('profile')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('signOut')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
