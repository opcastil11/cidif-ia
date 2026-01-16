'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wand2, CheckCircle, AlertCircle, FileCode2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ParsedSection {
  key: string
  name: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'link' | 'file'
  options?: string[]
  required: boolean
  helpText?: string
}

interface ParsedFund {
  name?: string
  organization?: string
  description?: string
  sections: ParsedSection[]
}

interface HtmlFundImporterProps {
  onImport: (fund: ParsedFund) => void
  language?: string
  targetPageId?: string
  targetPageName?: string
}

export function HtmlFundImporter({ onImport, language = 'es', targetPageId, targetPageName }: HtmlFundImporterProps) {
  const t = useTranslations('backoffice.htmlImport')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedFund | null>(null)

  const handleParse = async () => {
    if (!html.trim()) {
      setError(t('emptyHtml'))
      return
    }

    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const response = await fetch('/api/admin/parse-fund-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, language }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('parseError'))
      }

      if (data.fund) {
        setPreview(data.fund)
      }
    } catch (err) {
      console.error('Error parsing HTML:', err)
      setError(err instanceof Error ? err.message : t('parseError'))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmImport = () => {
    if (preview) {
      onImport(preview)
      setHtml('')
      setPreview(null)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: t('fieldTypes.text'),
      textarea: t('fieldTypes.textarea'),
      select: t('fieldTypes.select'),
      multiselect: t('fieldTypes.multiselect'),
      link: t('fieldTypes.link'),
      file: t('fieldTypes.file'),
    }
    return labels[type] || type
  }

  const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'select':
      case 'multiselect':
        return 'secondary'
      case 'file':
      case 'link':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {targetPageName ? t('descriptionForPage', { pageName: targetPageName }) : t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="html-input">{t('inputLabel')}</Label>
              <Textarea
                id="html-input"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{t('inputHelp')}</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              onClick={handleParse}
              disabled={loading || !html.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('parsing')}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {t('parseButton')}
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{t('parseSuccess', { count: preview.sections.length })}</span>
            </div>

            {(preview.name || preview.organization) && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                {preview.name && (
                  <p className="font-medium">{preview.name}</p>
                )}
                {preview.organization && (
                  <p className="text-sm text-muted-foreground">{preview.organization}</p>
                )}
                {preview.description && (
                  <p className="text-sm text-muted-foreground mt-2">{preview.description}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('previewLabel')}</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {preview.sections.map((section, index) => (
                  <div
                    key={section.key || index}
                    className="p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{section.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{section.key}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={getTypeBadgeVariant(section.type)}>
                          {getTypeLabel(section.type)}
                        </Badge>
                        {section.required && (
                          <Badge variant="destructive" className="text-xs">
                            *
                          </Badge>
                        )}
                      </div>
                    </div>
                    {section.helpText && (
                      <p className="text-xs text-muted-foreground mt-1">{section.helpText}</p>
                    )}
                    {section.options && section.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {section.options.slice(0, 5).map((opt, i) => (
                          <span key={i} className="text-xs bg-background px-2 py-0.5 rounded">
                            {opt}
                          </span>
                        ))}
                        {section.options.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{section.options.length - 5} {t('moreOptions')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPreview(null)
                  setError(null)
                }}
                className="flex-1"
              >
                {t('cancelButton')}
              </Button>
              <Button onClick={handleConfirmImport} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('importButton')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
