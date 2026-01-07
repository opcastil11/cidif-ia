'use client'

import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
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
} from 'lucide-react'

// Admin emails that can access backoffice
const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech']

interface MobileSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userEmail?: string
}

export function MobileSidebar({ open, onOpenChange, userEmail }: MobileSidebarProps) {
    const pathname = usePathname()
    const t = useTranslations('sidebar')
    const tCommon = useTranslations('common')
    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail)

    const navigation = [
        { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('projects'), href: '/dashboard/projects', icon: FolderKanban },
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="w-72 bg-slate-900 border-slate-800 p-0"
            >
                <SheetHeader className="px-6 pt-4 pb-0">
                    <SheetTitle asChild>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2"
                            onClick={() => onOpenChange(false)}
                        >
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">CI</span>
                            </div>
                            <span className="text-white font-semibold text-xl">CIDIF.TECH</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col px-6 py-4">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className="-mx-2 space-y-1">
                                {navigation.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => onOpenChange(false)}
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
                                            onClick={() => onOpenChange(false)}
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
            </SheetContent>
        </Sheet>
    )
}
