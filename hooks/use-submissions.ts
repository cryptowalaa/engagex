'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Submission } from '@/types/database'

export function useSubmissions(missionId?: string, creatorId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSubmissions() }, [missionId, creatorId])

  async function fetchSubmissions() {
    setLoading(true)
    try {
      let query = supabase
        .from('submissions')
        .select('*, creator:users(id, username, wallet_address, avatar_url), mission:missions(id, title)')
        .order('score', { ascending: false })

      if (missionId) query = query.eq('mission_id', missionId)
      if (creatorId) query = query.eq('creator_id', creatorId)

      const { data } = await query
      setSubmissions(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function createSubmission(submission: Partial<Submission>) {
    const { data, error } = await (supabase
      .from('submissions') as any)
      .insert(submission)
      .select()
      .single()
    if (!error) await fetchSubmissions()
    return { data, error }
  }

  async function updateSubmission(id: string, updates: Partial<Submission>) {
    const { data, error } = await (supabase
      .from('submissions') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetchSubmissions()
    return { data, error }
  }

  return { submissions, loading, refetch: fetchSubmissions, createSubmission, updateSubmission }
}
