'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProjectDraft, WizardStep } from '@/types/project'

interface UseAutoSaveOptions {
  projectId?: string | null
  debounceMs?: number
  enabled?: boolean
}

interface UseAutoSaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
  saveDraft: (data: Record<string, unknown>, wizardStep?: number) => Promise<void>
  loadDraft: () => Promise<ProjectDraft | null>
  clearDraft: () => Promise<void>
  markAsChanged: () => void
}

export function useAutoSave({
  projectId = null,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const pendingData = useRef<{ data: Record<string, unknown>; wizardStep?: number } | null>(null)

  const supabase = createClient()

  // Get current user ID
  const getUserId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  }, [supabase])

  // Save draft to database
  const saveDraftToDb = useCallback(async (data: Record<string, unknown>, wizardStep?: number) => {
    if (!enabled) return

    setIsSaving(true)
    setError(null)

    try {
      const userId = await getUserId()
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const draftData = {
        user_id: userId,
        project_id: projectId || null,
        draft_data: data,
        wizard_step: wizardStep || 1,
        last_saved_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }

      // Upsert draft - use project_id for existing projects, null for new
      const { error: upsertError } = await supabase
        .from('project_drafts')
        .upsert(draftData, {
          onConflict: 'user_id,project_id',
        })

      if (upsertError) {
        throw upsertError
      }

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Error saving draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }, [enabled, projectId, getUserId, supabase])

  // Debounced save
  const saveDraft = useCallback(async (data: Record<string, unknown>, wizardStep?: number) => {
    if (!enabled) return

    // Store pending data
    pendingData.current = { data, wizardStep }
    setHasUnsavedChanges(true)

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      if (pendingData.current) {
        await saveDraftToDb(pendingData.current.data, pendingData.current.wizardStep)
        pendingData.current = null
      }
    }, debounceMs)
  }, [enabled, debounceMs, saveDraftToDb])

  // Load draft from database
  const loadDraft = useCallback(async (): Promise<ProjectDraft | null> => {
    if (!enabled) return null

    try {
      const userId = await getUserId()
      if (!userId) return null

      const { data, error: loadError } = await supabase
        .from('project_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId || null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (loadError) {
        if (loadError.code === 'PGRST116') {
          // No draft found
          return null
        }
        throw loadError
      }

      return data as ProjectDraft
    } catch (err) {
      console.error('Error loading draft:', err)
      return null
    }
  }, [enabled, projectId, getUserId, supabase])

  // Clear draft from database
  const clearDraft = useCallback(async () => {
    if (!enabled) return

    try {
      const userId = await getUserId()
      if (!userId) return

      await supabase
        .from('project_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId || null)

      setLastSaved(null)
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Error clearing draft:', err)
    }
  }, [enabled, projectId, getUserId, supabase])

  // Mark as changed (for manual trigger)
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // Save pending changes before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    error,
    saveDraft,
    loadDraft,
    clearDraft,
    markAsChanged,
  }
}

// Hook for draft recovery dialog
interface UseDraftRecoveryOptions {
  projectId?: string | null
  onRecover: (data: Record<string, unknown>, wizardStep: number) => void
}

interface UseDraftRecoveryReturn {
  hasDraft: boolean
  draftData: ProjectDraft | null
  isLoading: boolean
  recoverDraft: () => void
  discardDraft: () => Promise<void>
  checkForDraft: () => Promise<void>
}

export function useDraftRecovery({
  projectId = null,
  onRecover,
}: UseDraftRecoveryOptions): UseDraftRecoveryReturn {
  const [hasDraft, setHasDraft] = useState(false)
  const [draftData, setDraftData] = useState<ProjectDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const checkForDraft = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('project_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId || null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!error && data) {
        setHasDraft(true)
        setDraftData(data as ProjectDraft)
      } else {
        setHasDraft(false)
        setDraftData(null)
      }
    } catch (err) {
      console.error('Error checking for draft:', err)
      setHasDraft(false)
      setDraftData(null)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  const recoverDraft = useCallback(() => {
    if (draftData) {
      onRecover(draftData.draft_data, draftData.wizard_step)
      setHasDraft(false)
    }
  }, [draftData, onRecover])

  const discardDraft = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('project_drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId || null)

      setHasDraft(false)
      setDraftData(null)
    } catch (err) {
      console.error('Error discarding draft:', err)
    }
  }, [projectId, supabase])

  // Check for draft on mount
  useEffect(() => {
    checkForDraft()
  }, [checkForDraft])

  return {
    hasDraft,
    draftData,
    isLoading,
    recoverDraft,
    discardDraft,
    checkForDraft,
  }
}
