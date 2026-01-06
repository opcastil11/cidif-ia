'use client'

import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    ArrowRight,
    Sparkles,
    Globe,
    FileCheck,
    Zap,
    Shield,
    Brain,
    Cpu,
    BarChart3,
    Building2,
    Leaf,
    Heart,
    Truck,
    Sun,
    Factory,
    ShoppingBag,
    HardHat,
    Gem,
    Fish,
    ChevronRight,
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Instagram,
    Scale,
    Lightbulb,
    Rocket,
    FlaskConical,
    BatteryCharging,
    Cable,
    Warehouse,
    Grape,
    Radar,
    Route,
    DollarSign,
    Check
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function Home() {
    const t = useTranslations()

    const services = [
        {
            icon: FileCheck,
            title: t('home.services.formulation.title'),
            description: t('home.services.formulation.description'),
            gradient: 'from-teal-500 to-cyan-500',
        },
        {
            icon: Cpu,
            title: t('home.services.execution.title'),
            description: t('home.services.execution.description'),
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            icon: Scale,
            title: t('home.services.rdLaw.title'),
            description: t('home.services.rdLaw.description'),
            gradient: 'from-orange-500 to-rose-500',
        },
        {
            icon: Lightbulb,
            title: t('home.services.innovation.title'),
            description: t('home.services.innovation.description'),
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            icon: Rocket,
            title: t('home.services.capital.title'),
            description: t('home.services.capital.description'),
            gradient: 'from-pink-500 to-rose-500',
        },
        {
            icon: Sparkles,
            title: t('home.services.ai.title'),
            description: t('home.services.ai.description'),
            gradient: 'from-violet-500 to-purple-500',
        },
    ]

    const researchLines = [
        {
            icon: Brain,
            title: t('home.research.dataScience.title'),
            description: t('home.research.dataScience.description'),
            gradient: 'from-blue-500 to-indigo-500',
        },
        {
            icon: BarChart3,
            title: t('home.research.imageProcessing.title'),
            description: t('home.research.imageProcessing.description'),
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            icon: Cpu,
            title: t('home.research.smartIoT.title'),
            description: t('home.research.smartIoT.description'),
            gradient: 'from-teal-500 to-emerald-500',
        },
    ]

    const industries = [
        { icon: Leaf, name: t('home.industries.food') },
        { icon: Globe, name: t('home.industries.environment') },
        { icon: Building2, name: t('home.industries.smartCities') },
        { icon: Heart, name: t('home.industries.health') },
        { icon: Truck, name: t('home.industries.logistics') },
        { icon: Shield, name: t('home.industries.security') },
        { icon: Sun, name: t('home.industries.energy') },
        { icon: Fish, name: t('home.industries.agriculture') },
        { icon: HardHat, name: t('home.industries.construction') },
        { icon: ShoppingBag, name: t('home.industries.retail') },
        { icon: Factory, name: t('home.industries.manufacturing') },
        { icon: Gem, name: t('home.industries.mining') },
    ]

    const stats = [
        { value: '$50M+', label: t('home.stats.funding') },
        { value: '500+', label: t('home.stats.projects') },
        { value: '95%', label: t('home.stats.successRate') },
        { value: '20+', label: t('home.stats.countries') },
    ]

    const allies = [
        'Universidad de Chile',
        'Pontificia Universidad Católica',
        'Universidad de Santiago',
        'CORFO',
        'ANID',
        'Fraunhofer',
    ]

    const successCases = [
        {
            key: 'aquaculture',
            icon: Fish,
            title: t('home.successCases.projects.aquaculture.title'),
            description: t('home.successCases.projects.aquaculture.description'),
            client: t('home.successCases.projects.aquaculture.client'),
            amount: t('home.successCases.projects.aquaculture.amount'),
            gradient: 'from-cyan-500 to-blue-600',
        },
        {
            key: 'solar',
            icon: Sun,
            title: t('home.successCases.projects.solar.title'),
            description: t('home.successCases.projects.solar.description'),
            client: t('home.successCases.projects.solar.client'),
            amount: t('home.successCases.projects.solar.amount'),
            gradient: 'from-amber-500 to-orange-500',
        },
        {
            key: 'electrical',
            icon: Cable,
            title: t('home.successCases.projects.electrical.title'),
            description: t('home.successCases.projects.electrical.description'),
            client: t('home.successCases.projects.electrical.client'),
            amount: t('home.successCases.projects.electrical.amount'),
            gradient: 'from-yellow-500 to-amber-600',
        },
        {
            key: 'warehouse',
            icon: Warehouse,
            title: t('home.successCases.projects.warehouse.title'),
            description: t('home.successCases.projects.warehouse.description'),
            client: t('home.successCases.projects.warehouse.client'),
            amount: t('home.successCases.projects.warehouse.amount'),
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            key: 'floating',
            icon: BatteryCharging,
            title: t('home.successCases.projects.floating.title'),
            description: t('home.successCases.projects.floating.description'),
            client: t('home.successCases.projects.floating.client'),
            amount: t('home.successCases.projects.floating.amount'),
            gradient: 'from-teal-500 to-emerald-600',
        },
        {
            key: 'cherry',
            icon: Grape,
            title: t('home.successCases.projects.cherry.title'),
            description: t('home.successCases.projects.cherry.description'),
            client: t('home.successCases.projects.cherry.client'),
            amount: t('home.successCases.projects.cherry.amount'),
            gradient: 'from-rose-500 to-pink-600',
        },
        {
            key: 'birds',
            icon: Radar,
            title: t('home.successCases.projects.birds.title'),
            description: t('home.successCases.projects.birds.description'),
            client: t('home.successCases.projects.birds.client'),
            amount: t('home.successCases.projects.birds.amount'),
            gradient: 'from-emerald-500 to-green-600',
        },
        {
            key: 'logistics',
            icon: Route,
            title: t('home.successCases.projects.logistics.title'),
            description: t('home.successCases.projects.logistics.description'),
            client: t('home.successCases.projects.logistics.client'),
            amount: t('home.successCases.projects.logistics.amount'),
            gradient: 'from-indigo-500 to-blue-600',
        },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
                <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-heading font-bold text-xl tracking-tight">CIDIF<span className="text-primary">.TECH</span></span>
                            <span className="text-[10px] text-muted-foreground -mt-1">{t('home.header.subtitle')}</span>
                        </div>
                        <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">v1.0.8</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.services')}</a>
                        <a href="#research" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.research')}</a>
                        <a href="#industries" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.industries')}</a>
                        <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.contact')}</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Button asChild variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                            <Link href="/login">{t('common.signIn')}</Link>
                        </Button>
                        <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <Link href="/login">{t('common.getStarted')}</Link>
                        </Button>
                    </div>
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative py-20 sm:py-28 lg:py-36">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                                <FlaskConical className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">{t('home.hero.badge')}</span>
                            </div>

                            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                                {t('home.hero.title')}
                                <span className="block text-gradient mt-2">
                                    {t('home.hero.titleHighlight')}
                                </span>
                            </h1>

                            <p className="mt-8 text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto">
                                {t('home.hero.description')}
                            </p>

                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 shadow-xl shadow-primary/20 hover-lift">
                                    <Link href="/login">
                                        {t('home.hero.cta')}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="text-lg px-8 h-14 border-2">
                                    <a href="#services">
                                        {t('home.hero.ctaSecondary')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 border-y border-border/50 bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-gradient">{stat.value}</div>
                                    <div className="mt-2 text-sm sm:text-base text-muted-foreground">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="services" className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{t('home.services.title')}</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('home.services.subtitle')}</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {services.map((service, index) => (
                                <Card
                                    key={service.title}
                                    className="group relative bg-card border-border hover-lift cursor-pointer overflow-hidden"
                                >
                                    <CardContent className="p-6">
                                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <service.icon className="h-7 w-7 text-white" />
                                        </div>
                                        <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Research Lines Section */}
                <section id="research" className="py-24 bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{t('home.research.title')}</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('home.research.subtitle')}</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {researchLines.map((line) => (
                                <div
                                    key={line.title}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Card className="relative bg-card border-border hover-lift h-full">
                                        <CardContent className="p-8 text-center">
                                            <div className={`h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br ${line.gradient} flex items-center justify-center mb-6 shadow-xl`}>
                                                <line.icon className="h-10 w-10 text-white" />
                                            </div>
                                            <h3 className="font-heading text-2xl font-semibold text-foreground mb-4">{line.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">{line.description}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Success Cases Section */}
                <section id="cases" className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{t('home.successCases.title')}</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('home.successCases.subtitle')}</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {successCases.map((project) => (
                                <Card
                                    key={project.key}
                                    className="group relative bg-card border-border hover-lift cursor-pointer overflow-hidden"
                                >
                                    <CardContent className="p-6">
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <project.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{project.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.description}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <span className="text-xs text-muted-foreground">{project.client}</span>
                                            <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                                                <DollarSign className="h-3 w-3" />
                                                {project.amount.replace('$', '')}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Industries Section */}
                <section id="industries" className="py-24 bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{t('home.industries.title')}</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('home.industries.subtitle')}</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {industries.map((industry) => (
                                <div
                                    key={industry.name}
                                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <industry.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-sm font-medium text-center text-foreground">{industry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{t('home.pricing.title')}</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('home.pricing.subtitle')}</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
                            {/* Free Plan */}
                            <Card className="relative bg-card border-border hover-lift">
                                <CardContent className="p-8">
                                    <h3 className="font-heading text-2xl font-bold text-foreground">{t('home.pricing.free.name')}</h3>
                                    <p className="text-muted-foreground mt-2">{t('home.pricing.free.description')}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-heading font-bold text-foreground">$0</span>
                                        <span className="text-muted-foreground">/{t('home.pricing.monthly')}</span>
                                    </div>
                                    <Button asChild className="w-full mt-6" variant="outline">
                                        <Link href="/login">{t('home.pricing.getStarted')}</Link>
                                    </Button>
                                    <ul className="mt-8 space-y-3">
                                        {(t.raw('home.pricing.free.features') as string[]).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Standard Plan */}
                            <Card className="relative bg-card border-primary shadow-xl shadow-primary/10 hover-lift scale-105">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                                    {t('home.pricing.popular')}
                                </div>
                                <CardContent className="p-8">
                                    <h3 className="font-heading text-2xl font-bold text-foreground">{t('home.pricing.standard.name')}</h3>
                                    <p className="text-muted-foreground mt-2">{t('home.pricing.standard.description')}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-heading font-bold text-foreground">$50</span>
                                        <span className="text-muted-foreground">/{t('home.pricing.monthly')}</span>
                                    </div>
                                    <Button asChild className="w-full mt-6 bg-primary hover:bg-primary/90">
                                        <Link href="/login">{t('home.pricing.subscribe')}</Link>
                                    </Button>
                                    <ul className="mt-8 space-y-3">
                                        {(t.raw('home.pricing.standard.features') as string[]).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Max Plan */}
                            <Card className="relative bg-card border-border hover-lift">
                                <CardContent className="p-8">
                                    <h3 className="font-heading text-2xl font-bold text-foreground">{t('home.pricing.max.name')}</h3>
                                    <p className="text-muted-foreground mt-2">{t('home.pricing.max.description')}</p>
                                    <div className="mt-6">
                                        <span className="text-4xl font-heading font-bold text-foreground">$100</span>
                                        <span className="text-muted-foreground">/{t('home.pricing.monthly')}</span>
                                    </div>
                                    <Button asChild className="w-full mt-6" variant="outline">
                                        <Link href="/login">{t('home.pricing.subscribe')}</Link>
                                    </Button>
                                    <ul className="mt-8 space-y-3">
                                        {(t.raw('home.pricing.max.features') as string[]).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Allies Section */}
                <section className="py-16 border-y border-border/50 bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <h3 className="text-center text-sm font-medium text-muted-foreground mb-8">{t('home.allies.title')}</h3>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                            {allies.map((ally) => (
                                <div key={ally} className="text-lg font-heading font-medium text-muted-foreground/60 hover:text-foreground transition-colors">
                                    {ally}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Meetings Section */}
                <section id="meetings" className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">{t('home.meetings.title')}</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('home.meetings.subtitle')}</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                            {/* Intro Meeting Card */}
                            <Card className="bg-card border-border overflow-hidden relative hover-lift group">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />
                                <CardContent className="p-8 relative">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Phone className="h-7 w-7 text-white" />
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-sm font-medium">
                                            {t('home.meetings.free')}
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">{t('home.meetings.intro.title')}</h3>
                                    <p className="text-muted-foreground mb-4">30 {t('home.meetings.minutes')}</p>
                                    <p className="text-muted-foreground leading-relaxed mb-6">{t('home.meetings.intro.description')}</p>
                                    <ul className="space-y-2 mb-6">
                                        {(t.raw('home.meetings.intro.features') as string[]).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button asChild className="w-full bg-teal-600 hover:bg-teal-600/90">
                                        <Link href="/login">
                                            {t('home.meetings.bookNow')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Review Meeting Card */}
                            <Card className="bg-card border-primary/50 overflow-hidden relative hover-lift group shadow-xl shadow-primary/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
                                <div className="absolute -top-4 right-6 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                                    {t('home.meetings.recommended')}
                                </div>
                                <CardContent className="p-8 pt-10 relative">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Heart className="h-7 w-7 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-heading font-bold text-foreground">{t('home.meetings.review.priceFrom')}</div>
                                            <span className="text-xs text-muted-foreground">USD</span>
                                        </div>
                                    </div>
                                    <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">{t('home.meetings.review.title')}</h3>
                                    <p className="text-muted-foreground mb-4">120 {t('home.meetings.minutes')}</p>
                                    <p className="text-muted-foreground leading-relaxed mb-6">{t('home.meetings.review.description')}</p>
                                    <ul className="space-y-2 mb-6">
                                        {(t.raw('home.meetings.review.features') as string[]).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                        <Link href="/login">
                                            {t('home.meetings.bookNow')}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 p-12 lg:p-16 text-center overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/5" />
                            <div className="relative">
                                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">{t('home.cta.title')}</h2>
                                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">{t('home.cta.subtitle')}</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-10 h-14 shadow-xl shadow-primary/20">
                                        <Link href="/login">
                                            {t('home.cta.button')}
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" variant="outline" className="text-lg px-10 h-14 border-2">
                                        <a href="#contact">
                                            {t('home.cta.contact')}
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-24 bg-muted/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                            <div>
                                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-6">{t('home.contact.title')}</h2>
                                <p className="text-lg text-muted-foreground mb-8">{t('home.contact.subtitle')}</p>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{t('home.contact.address.label')}</h4>
                                            <p className="text-muted-foreground">Cerro Colorado #5858 Oficina 202<br />Las Condes, Santiago, Chile</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Mail className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{t('home.contact.email.label')}</h4>
                                            <a href="mailto:contacto@cidif.tech" className="text-primary hover:underline">contacto@cidif.tech</a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Phone className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{t('home.contact.phone.label')}</h4>
                                            <a href="tel:+56342376264" className="text-primary hover:underline">+56 34 237 6264</a>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-4">
                                    <a href="https://linkedin.com/company/cidif" target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-colors">
                                        <Linkedin className="h-5 w-5 text-muted-foreground" />
                                    </a>
                                    <a href="https://instagram.com/cidif.tech" target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-colors">
                                        <Instagram className="h-5 w-5 text-muted-foreground" />
                                    </a>
                                </div>
                            </div>

                            <div className="relative">
                                <Card className="bg-card border-border">
                                    <CardContent className="p-8">
                                        <h3 className="font-heading text-xl font-semibold text-foreground mb-6">{t('home.contact.form.title')}</h3>
                                        <form className="space-y-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder={t('home.contact.form.name')}
                                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="email"
                                                    placeholder={t('home.contact.form.email')}
                                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder={t('home.contact.form.company')}
                                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <textarea
                                                    rows={4}
                                                    placeholder={t('home.contact.form.message')}
                                                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                                />
                                            </div>
                                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12">
                                                {t('home.contact.form.submit')}
                                                <ChevronRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-heading font-bold text-xl">CIDIF<span className="text-primary">.TECH</span></span>
                            </div>
                            <p className="text-muted-foreground max-w-md">{t('home.footer.description')}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground mb-4">{t('home.footer.links.title')}</h4>
                            <ul className="space-y-2">
                                <li><a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.services')}</a></li>
                                <li><a href="#research" className="text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.research')}</a></li>
                                <li><a href="#industries" className="text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.industries')}</a></li>
                                <li><a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">{t('home.nav.contact')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground mb-4">{t('home.footer.legal.title')}</h4>
                            <ul className="space-y-2">
                                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('common.terms')}</Link></li>
                                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('common.privacy')}</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-muted-foreground text-sm">
                            &copy; {new Date().getFullYear()} CIDIF.TECH. {t('common.allRightsReserved')}
                        </p>
                        <a href="https://www.forcast.cl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                            www.forcast.cl
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
