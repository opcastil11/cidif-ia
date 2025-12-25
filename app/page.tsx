import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Globe, FileCheck, TrendingUp } from 'lucide-react'

export default function Home() {
    const features = [
        {
            icon: Sparkles,
            title: 'AI-Powered Assistance',
            description: 'Get intelligent help formulating your applications with our Claude-powered assistant.',
        },
        {
            icon: Globe,
            title: 'Global Fund Catalog',
            description: 'Access funds from LATAM, USA, and Europe all in one place.',
        },
        {
            icon: FileCheck,
            title: 'Streamlined Applications',
            description: 'Track your applications and manage all your projects from a single dashboard.',
        },
        {
            icon: TrendingUp,
            title: 'Increase Success Rate',
            description: 'Our tools help you write better applications and improve your chances.',
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Header */}
            <header className="relative z-10 border-b border-white/10">
                <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">CI</span>
                        </div>
                        <span className="text-white font-semibold text-xl">CIDIF.TECH</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <main className="relative z-10">
                <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Apply for Funds with
                            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                AI-Powered Assistance
                            </span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-white/60 max-w-2xl mx-auto">
                            CIDIF.TECH helps entrepreneurs and startups navigate public and private funding opportunities across LATAM, USA, and Europe.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
                                <Link href="/login">
                                    Start Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="mx-auto max-w-7xl px-6 pb-24">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-colors"
                            >
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/60 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10">
                <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-sm">
                        &copy; {new Date().getFullYear()} CIDIF.TECH. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-white/40 hover:text-white/60 text-sm">
                            Terms
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white/60 text-sm">
                            Privacy
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
