'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2, GripVertical } from 'lucide-react'

interface Section {
    id: string
    key: string
    name: string
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'link' | 'file'
    options?: string[]
    required: boolean
    helpText?: string
}

export default function NewFundPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        country: 'CL',
        type: 'grant',
        amount_min: '',
        amount_max: '',
        currency: 'USD',
        deadline: '',
        url: '',
        description: '',
    })
    const [sections, setSections] = useState<Section[]>([])

    const addSection = () => {
        setSections([
            ...sections,
            {
                id: crypto.randomUUID(),
                key: `section_${sections.length + 1}`,
                name: '',
                type: 'textarea',
                required: true,
                options: [],
            },
        ])
    }

    const updateSection = (id: string, updates: Partial<Section>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClient()

            // Create fund
            const { data: fund, error } = await supabase
                .from('funds')
                .insert({
                    ...formData,
                    amount_min: formData.amount_min ? parseFloat(formData.amount_min) : null,
                    amount_max: formData.amount_max ? parseFloat(formData.amount_max) : null,
                    requirements: { sections: sections.map(({ id, ...s }) => s) },
                    is_active: true,
                })
                .select()
                .single()

            if (error) throw error

            router.push('/backoffice/funds')
        } catch (error) {
            console.error('Error creating fund:', error)
            alert('Error al crear el fondo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Nuevo Fondo</h2>
                <p className="text-muted-foreground">Crear un nuevo template de postulación</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Información del Fondo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Fondo *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Crea y Valida 2024"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="organization">Organización *</Label>
                                <Input
                                    id="organization"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    placeholder="Ej: CORFO"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <select
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border"
                                >
                                    <option value="CL">Chile</option>
                                    <option value="MX">México</option>
                                    <option value="CO">Colombia</option>
                                    <option value="AR">Argentina</option>
                                    <option value="PE">Perú</option>
                                    <option value="US">USA</option>
                                    <option value="EU">Europa</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo</Label>
                                <select
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border"
                                >
                                    <option value="grant">Subsidio</option>
                                    <option value="loan">Préstamo</option>
                                    <option value="equity">Capital</option>
                                    <option value="mixed">Mixto</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline">Fecha Cierre</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="amount_min">Monto Mínimo</Label>
                                <Input
                                    id="amount_min"
                                    type="number"
                                    value={formData.amount_min}
                                    onChange={(e) => setFormData({ ...formData, amount_min: e.target.value })}
                                    placeholder="10000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount_max">Monto Máximo</Label>
                                <Input
                                    id="amount_max"
                                    type="number"
                                    value={formData.amount_max}
                                    onChange={(e) => setFormData({ ...formData, amount_max: e.target.value })}
                                    placeholder="100000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Moneda</Label>
                                <select
                                    id="currency"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border"
                                >
                                    <option value="USD">USD</option>
                                    <option value="CLP">CLP</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">URL del Fondo</Label>
                            <Input
                                id="url"
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sections */}
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Secciones del Formulario</CardTitle>
                        <Button type="button" onClick={addSection} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Sección
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sections.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No hay secciones. Agrega secciones para crear el formulario de postulación.
                            </p>
                        ) : (
                            sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    className="p-4 rounded-lg border border-border bg-muted/30"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Sección {index + 1}
                                        </span>
                                        <div className="flex-1" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSection(section.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Nombre de la Sección</Label>
                                            <Input
                                                value={section.name}
                                                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                                                placeholder="Ej: Descripción del Proyecto"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Clave (key)</Label>
                                            <Input
                                                value={section.key}
                                                onChange={(e) => updateSection(section.id, { key: e.target.value })}
                                                placeholder="Ej: project_description"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tipo de Campo</Label>
                                            <select
                                                value={section.type}
                                                onChange={(e) => updateSection(section.id, { type: e.target.value as Section['type'] })}
                                                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                                            >
                                                <option value="text">Texto Corto</option>
                                                <option value="textarea">Texto Largo</option>
                                                <option value="select">Selección Única</option>
                                                <option value="multiselect">Selección Múltiple</option>
                                                <option value="link">Enlace (Video/Doc)</option>
                                                <option value="file">Archivo</option>
                                            </select>
                                        </div>
                                    </div>

                                    {(section.type === 'select' || section.type === 'multiselect') && (
                                        <div className="mt-4 space-y-2">
                                            <Label>Opciones (una por línea)</Label>
                                            <Textarea
                                                value={section.options?.join('\n') || ''}
                                                onChange={(e) => updateSection(section.id, { options: e.target.value.split('\n').filter(Boolean) })}
                                                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-2">
                                        <Label>Texto de Ayuda</Label>
                                        <Input
                                            value={section.helpText || ''}
                                            onChange={(e) => updateSection(section.id, { helpText: e.target.value })}
                                            placeholder="Instrucciones para el usuario..."
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Guardando...' : 'Guardar Fondo'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
