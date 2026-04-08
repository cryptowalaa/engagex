'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useFollowStatus(followerId: string | null, followingId: string | null) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!followerId || !followingId) {
      setLoading(false)
      return
    }

    async function checkStatus() {
      const { data } = await (supabase.from('follows') as any)
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle()
      
      setIsFollowing(!!data)
      setLoading(false)
    }

    checkStatus()
  }, [followerId, followingId])

  return { isFollowing, loading }
}

export function useFollowCounts(userId: string | null) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadCounts() {
      // Get followers count
      const { count: followers } = await (supabase.from('follows') as any)
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId)

      // Get following count  
      const { count: following } = await (supabase.from('follows') as any)
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)

      setCounts({ 
        followers: followers || 0, 
        following: following || 0 
      })
      setLoading(false)
    }

    loadCounts()
  }, [userId])

  return { counts, loading }
}
