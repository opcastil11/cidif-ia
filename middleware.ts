import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Public API routes that don't require authentication (use their own auth)
const publicApiRoutes = ['/api/auth', '/api/stripe/webhook', '/api/admin/migrate', '/api/orquesta', '/api/agent/diagnose']

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Handle API routes separately (before i18n middleware)
    if (pathname.startsWith('/api/')) {
        // Skip auth for public API routes
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
            return NextResponse.next()
        }

        // Check Supabase auth for protected API routes
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('[Middleware] Supabase environment variables not configured')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        try {
            const response = NextResponse.next()
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

            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                console.log('[Middleware] API auth failed:', error?.message || 'No user session')
                return NextResponse.json(
                    { error: 'Authentication required', code: 'AUTH_REQUIRED' },
                    { status: 401 }
                )
            }

            // User is authenticated, continue to API route
            return response
        } catch (error) {
            console.error('[Middleware] API auth error:', error)
            return NextResponse.json(
                { error: 'Authentication error', code: 'AUTH_ERROR' },
                { status: 401 }
            )
        }
    }

    // Handle i18n routing for non-API routes
    const response = intlMiddleware(request)

    // Get the pathname without locale prefix for auth checks
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
