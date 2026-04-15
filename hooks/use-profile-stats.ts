import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useProfileStats(userId: string | null) {
  const [stats, setStats] = useState({
    submissions_count: 0,
    rank: 1,
    badge: 'Early Adopter'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    
    async function loadStats() {
      try {
        const { count: submissionsCount } = await (supabase
          .from('submissions') as any)
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', userId)

        const { data: leaderboard } = await (supabase
          .from('users') as any)
          .select('id, total_points')
          .order('total_points', { ascending: false })
          .limit(100)

        const rank = leaderboard?.findIndex((u: any) => u.id === userId) + 1 || 1

        let badge = 'Creator'
        if (rank === 1) badge = '🏆 Top Creator'
        else if (rank <= 10) badge = '⭐ Rising Star'
        else if ((submissionsCount || 0) > 50) badge = '🎯 Power User'
        else if ((submissionsCount || 0) > 10) badge = '🚀 Active'
        else badge = '✨ Early Adopter'

        setStats({
          submissions_count: submissionsCount || 0,
          rank: rank > 0 ? rank : 100,
          badge
        })
      } catch (error) {
        console.error('Stats load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userId])

  return { stats, loading }
}
