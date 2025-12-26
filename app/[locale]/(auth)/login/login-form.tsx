'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Chrome } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const t = useTranslations('login')

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        const supabase = createClient()

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('Login error:', error)
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
                <Chrome className="mr-2 h-5 w-5" />
                {isLoading ? t('connecting') : t('continueWithGoogle')}
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/40">
                        {t('secureAuth')}
                    </span>
                </div>
            </div>

            <p className="text-center text-white/40 text-sm">
                {t('termsNotice')}
            </p>
        </div>
    )
}
