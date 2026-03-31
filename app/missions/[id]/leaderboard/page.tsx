'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Trophy, ArrowLeft, Heart, MessageCircle, Share2, Target, CheckCircle } from 'lucide-react'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'
import Link from 'next/link'

interface LeaderboardEntry {
  submission_id: string
  creator_id: string
  creator_username: string | null
  creator_wallet: string
  content_link: string
  platform: string
  score: number
  likes: number
  comments: number
  shares: number
  rank: number
}

export default function MissionLeaderboardPage() {
  const params = useParams()
  const missionId = params.id as string
  const [mission, setMission] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!missionId) return
    loadLeaderboard()
  }, [missionId])

  async function loadLeaderboard() {
    setLoading(true)
    try {
      // Load mission details with brand info
      const { data: mData } = await (supabase
        .from('missions') as any)
        .select('*, brand:users(id, username, is_verified, wallet_address)')
        .eq('id', missionId)
        .single()

      setMission(mData)

      // Load submissions with engagement for THIS mission only
      const { data: subs } = await (supabase
        .from('submissions') as any)
        .select(`
          *,
          creator:users(id, username, wallet_address),
          engagement:engagements(*)
        `)
        .eq('mission_id', missionId)
        .order('score', { ascending: false })

      // Transform to leaderboard format
      const entries: LeaderboardEntry[] = (subs || []).map((sub: any, index: number) => ({
        submission_id: sub.id,
        creator_id: sub.creator_id,
        creator_username: sub.creator?.username,
        creator_wallet: sub.creator?.wallet_address,
        content_link: sub.content_link,
        platform: sub.platform,
        score: sub.score || 0,
        likes: sub.engagement?.likes || 0,
        comments: sub.engagement?.comments || 0,
        shares: sub.engagement?.shares || 0,
        rank: index + 1
      }))

      setLeaderboard(entries)
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const rankColor = (i: number) => {
    if (i === 0) return 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30'
    if (i === 1) return 'bg-gray-400/15 text-gray-400 border-gray-400/30'
    if (i === 2) return 'bg-orange-400/15 text-orange-400 border-orange-400/30'
    return 'bg-brand-border text-gray-500 border-brand-border'
  }

  const rankIcon = (i: number) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href={`/missions/${missionId}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-green transition-all mb-4"
            >
              <ArrowLeft size={16} /> Back to Mission
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-black text-white mb-2">
                  {mission?.title}
                </h1>
                <div className="flex items-center gap-2 text-gray-400">
                  <Target size={16} className="text-brand-green" />
                  <span>Mission Leaderboard</span>
                  {mission?.brand?.is_verified && (
                    <span className="ml-2 flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} className="fill-current" />
                      Verified Brand
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Reward Pool</p>
                <p className="text-2xl font-black text-brand-green">
                  {formatUSDC(mission?.reward_pool || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-brand-border bg-brand-purple/5">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-brand-purple" />
                <h2 className="text-lg font-bold text-white">Top Creators Rankings</h2>
                <span className="text-xs text-gray-400 ml-auto">
                  Ranked by total engagement score
                </span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No submissions yet!</p>
                <p className="text-sm text-gray-500 mt-2">Be the first to submit</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-brand-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Creator</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Engagement</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr 
                        key={entry.submission_id} 
                        className="border-b border-brand-border/40 hover:bg-white/2 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border ${rankColor(entry.rank - 1)}`}>
                            {rankIcon(entry.rank - 1)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-bold">
                              {/* ✅ FIXED: Safe access with fallback */}
                              {entry.creator_username ? entry.creator_username[0].toUpperCase() : 'C'}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {/* ✅ FIXED: Safe fallback for display name */}
                                {entry.creator_username || (entry.creator_wallet ? shortenAddress(entry.creator_wallet, 4) : 'Unknown')}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">{entry.platform}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <Heart size={14} className="text-red-400" />
                              {entry.likes}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <MessageCircle size={14} className="text-blue-400" />
                              {entry.comments}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <Share2 size={14} className="text-green-400" />
                              {entry.shares}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-2xl font-black text-brand-green">
                            {entry.score.toFixed(0)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">pts</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-brand-dark border border-brand-border rounded-xl">
            <p className="text-sm text-gray-400">
              <span className="text-brand-green font-semibold">How it works:</span> Creators earn points based on engagement (likes, comments, shares). Top creators win from the 60% reward pool. Engagers earn points on the main leaderboard.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
