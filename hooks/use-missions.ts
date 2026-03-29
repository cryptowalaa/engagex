'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Mission, MissionStatus } from '@/types/database'

export function useMissions(status?: MissionStatus) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchMissions() }, [status])

  async function fetchMissions() {
    setLoading(true)
    try {
      let query = supabase
        .from('missions')
        .select('*, brand:users(id, username, wallet_address, avatar_url)')
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error
      setMissions(data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function createMission(mission: Partial<Mission>) {
    // @ts-ignore - Supabase type issue
    const { data, error } = await supabase
      .from('missions')
      .insert(mission)
      .select()
      .single()
    if (!error) await fetchMissions()
    return { data, error }
  }

  async function updateMission(id: string, updates: Partial<Mission>) {
    // @ts-ignore - Supabase type issue
    const { data, error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetchMissions()
    return { data, error }
  }

  return { missions, loading, error, refetch: fetchMissions, createMission, updateMission }
}

export function useMission(id: string) {
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('missions')
      .select('*, brand:users(id, username, wallet_address, avatar_url)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setMission(data); setLoading(false) })
  }, [id])

  return { mission, loading }
}
