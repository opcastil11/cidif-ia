import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
    // Handle i18n routing first
    const response = intlMiddleware(request)

    // Get the pathname without locale prefix for auth checks
    const pathname = request.nextUrl.pathname
    const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'

    // Skip auth check for public routes
    const publicRoutes = ['/', '/login', '/auth/callback']
    if (publicRoutes.some(route => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith('/auth/'))) {
        return response
    }

    // Check Supabase auth for protected routes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return response
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        // Protected routes - redirect to login if not authenticated
        if (!user && pathnameWithoutLocale.startsWith('/dashboard')) {
            const locale = pathname.match(/^\/(es|en)/)?.[1] || 'es'
            const url = request.nextUrl.clone()
            url.pathname = `/${locale}/login`
            return NextResponse.redirect(url)
        }

        return response
    } catch (error) {
        console.error('[Middleware] Error:', error)
        return response
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
