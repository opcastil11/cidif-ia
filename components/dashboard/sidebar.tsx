'use client'

import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    Landmark,
    User,
    CreditCard,
    Settings,
    Shield,
    Users,
    ClipboardCheck,
} from 'lucide-react'

// Admin emails that can access backoffice
const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech', 'opcastil@gmail.com']

interface SidebarProps {
    userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname()
    const t = useTranslations('sidebar')
    const tCommon = useTranslations('common')
    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail)

    const navigation = [
        { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('projects'), href: '/dashboard/projects', icon: FolderKanban },
        { name: t('evaluations'), href: '/dashboard/evaluations', icon: ClipboardCheck },
        { name: t('applications'), href: '/dashboard/applications', icon: FileText },
        { name: t('fundsCatalog'), href: '/dashboard/funds', icon: Landmark },
        { name: t('meetings'), href: '/dashboard/meetings', icon: Users },
    ]

    const secondaryNav = [
        { name: tCommon('profile'), href: '/dashboard/profile', icon: User },
        { name: tCommon('billing'), href: '/dashboard/billing', icon: CreditCard },
        { name: tCommon('settings'), href: '/dashboard/settings', icon: Settings },
        ...(isAdmin ? [{ name: 'Backoffice', href: '/backoffice', icon: Shield }] : []),
    ]

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 border-r border-slate-800 px-6 pb-4">
                    {/* Logo */}
                    <div className="flex h-16 shrink-0 items-center">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">CI</span>
                            </div>
                            <span className="text-white font-semibold text-xl">CIDIF.TECH</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    pathname === item.href
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                                                    'group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-colors'
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            <li className="mt-auto">
                                <ul role="list" className="-mx-2 space-y-1">
                                    {secondaryNav.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    pathname === item.href
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                                                    'group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-colors'
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    )
}
