'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Bot, Save, Loader2, MessageSquare, Send, X, Upload, FileText, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ProjectAgentTrainerProps {
  projectId: string
  initialContext?: string
  fundId?: string
}

export function ProjectAgentTrainer({ projectId, initialContext = '', fundId }: ProjectAgentTrainerProps) {
  const t = useTranslations('agentTrainer')
  const [context, setContext] = useState(initialContext)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSaveContext = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const response = await fetch('/api/agent/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, agentContext: context }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving context:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setSending(true)

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, projectId, fundId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: t('errorMessage') }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: t('errorMessage') }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t('uploadErrorType'))
      setTimeout(() => setUploadError(null), 5000)
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('uploadErrorSize'))
      setTimeout(() => setUploadError(null), 5000)
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const response = await fetch('/api/agent/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadSuccess(t('uploadSuccess', { fileName: file.name }))
        setTimeout(() => setUploadSuccess(null), 5000)
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setUploadError(data.error || t('uploadErrorGeneric'))
        setTimeout(() => setUploadError(null), 5000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(t('uploadErrorGeneric'))
      setTimeout(() => setUploadError(null), 5000)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Agent Training Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">{t('title')}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context" className="text-slate-200">{t('contextLabel')}</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t('contextPlaceholder')}
              rows={8}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">{t('contextHelp')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSaveContext}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? t('saved') : t('saveContext')}
            </Button>

            {/* File Upload */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {t('uploadFile')}
              </Button>
            </div>

            <Button
              onClick={() => setChatOpen(!chatOpen)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('testAgent')}
            </Button>
          </div>

          {/* Upload Status Messages */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Check className="h-4 w-4 text-green-400" />
              <p className="text-sm text-green-400">{uploadSuccess}</p>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <X className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Upload Help */}
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{t('uploadHelp')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {chatOpen && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white text-lg">{t('chatTitle')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-80 overflow-y-auto space-y-4 p-4 bg-slate-800/50 rounded-lg">
              {messages.length === 0 ? (
                <p className="text-slate-500 text-center text-sm">{t('chatEmpty')}</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chatPlaceholder')}
                rows={2}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !input.trim()}
                className="bg-purple-600 hover:bg-purple-700 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
