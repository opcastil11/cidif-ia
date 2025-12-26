'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Bot, Save, Upload, FileText, Loader2 } from 'lucide-react'

interface FundContext {
    id: string
    name: string
    context?: string
}

export default function AgentPage() {
    const [funds, setFunds] = useState<FundContext[]>([])
    const [selectedFund, setSelectedFund] = useState<string>('')
    const [context, setContext] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadFunds()
    }, [])

    const loadFunds = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('funds')
            .select('id, name, requirements')
            .order('name')

        setFunds(data?.map(f => ({
            id: f.id,
            name: f.name,
            context: (f.requirements as Record<string, unknown>)?.agent_context as string || '',
        })) || [])
        setLoading(false)
    }

    const handleFundChange = (fundId: string) => {
        setSelectedFund(fundId)
        const fund = funds.find(f => f.id === fundId)
        setContext(fund?.context || '')
    }

    const handleSave = async () => {
        if (!selectedFund) return
        setSaving(true)

        try {
            const supabase = createClient()

            // Get current requirements
            const { data: fund } = await supabase
                .from('funds')
                .select('requirements')
                .eq('id', selectedFund)
                .single()

            // Update with agent context
            await supabase
                .from('funds')
                .update({
                    requirements: {
                        ...(fund?.requirements as Record<string, unknown> || {}),
                        agent_context: context,
                    },
                })
                .eq('id', selectedFund)

            // Update local state
            setFunds(funds.map(f =>
                f.id === selectedFund ? { ...f, context } : f
            ))

            alert('Contexto guardado exitosamente')
        } catch (error) {
            console.error('Error saving context:', error)
            alert('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            setContext(event.target?.result as string || '')
        }
        reader.readAsText(file)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Gestión de Agentes IA</h2>
                <p className="text-muted-foreground">Configura el contexto de IA para cada fondo</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Fund Selector */}
                <Card className="bg-card border-border lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Fondos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {funds.map((fund) => (
                                <button
                                    key={fund.id}
                                    onClick={() => handleFundChange(fund.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                        selectedFund === fund.id
                                            ? 'bg-primary/10 border border-primary text-foreground'
                                            : 'bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{fund.name}</span>
                                        {fund.context && (
                                            <FileText className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                </button>
                            ))}

                            {funds.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">
                                    No hay fondos. Crea un fondo primero.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Context Editor */}
                <Card className="bg-card border-border lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Contexto del Agente</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <label className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir .md
                                    <input
                                        type="file"
                                        accept=".md,.txt"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={!selectedFund || saving}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Guardar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedFund ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>
                                        Contexto Markdown para el Agente IA
                                    </Label>
                                    <Textarea
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        placeholder={`# Contexto del Fondo

## Descripción
Describe el fondo y sus requisitos...

## Criterios de Evaluación
- Criterio 1
- Criterio 2

## Formato de Respuestas
Indica cómo debe responder el agente...

## Ejemplos
Proporciona ejemplos de buenas respuestas...`}
                                        className="min-h-[400px] font-mono text-sm"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Este contexto será usado por el agente IA para asistir a los usuarios
                                    en sus postulaciones a este fondo.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Bot className="h-12 w-12 mb-4" />
                                <p>Selecciona un fondo para editar su contexto</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
