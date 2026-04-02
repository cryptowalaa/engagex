'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Trophy, Users, TrendingUp, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { shortenAddress } from '@/lib/utils/helpers'
import Link from 'next/link'

interface LeaderboardUser {
  id: string
  wallet_address: string
  username: string | null
  avatar_url: string | null
  total_earned: number
  total_points: number
  missions_completed: number
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  useEffect(() => {
    loadLeaderboard()
  }, [timeFilter])

  async function loadLeaderboard() {
    setLoading(true)
    try {
      const { data } = await (supabase.from('users') as any)
        .select('id, wallet_address, username, avatar_url, total_earned, total_points, missions_completed')
        .order('total_earned', { ascending: false })
        .limit(100)
      
      setUsers(data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Avatar component
  const AvatarImage = ({ url, name, size = 48 }: { url: string | null, name: string | null, size?: number }) => {
    const [error, setError] = useState(false)
    
    if (!url || error) {
      return (
        <span className="text-lg font-black text-brand-dark flex items-center justify-center w-full h-full">
          {name?.[0]?.toUpperCase() || 'U'}
        </span>
      )
    }
    
    return (
      <img 
        src={url} 
        alt={name || 'User'} 
        className="object-cover w-full h-full"
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3">
                <Trophy size={32} className="text-yellow-400" />
                Leaderboard
              </h1>
              <p className="text-gray-400 mt-1">Top performers ranked by total earnings</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <Users size={24} className="text-brand-green mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{users.length}</p>
              <p className="text-xs text-gray-500">Total Creators</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <Trophy size={24} className="text-brand-purple mx-auto mb-2" />
              <p className="text-2xl font-black text-brand-green">
                {users.reduce((sum, u) => sum + (u.total_earned || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Total Distributed</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <TrendingUp size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">
                {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.total_earned || 0), 0) / users.length) : 0}
              </p>
              <p className="text-xs text-gray-500">Avg Earnings</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6">
            {(['all', 'week', 'month'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  timeFilter === filter
                    ? 'bg-brand-green text-brand-dark'
                    : 'bg-brand-card border border-brand-border text-gray-400 hover:border-brand-green/30'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Leaderboard List */}
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-brand-dark rounded-xl animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 text-gray-700" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {users.map((user, index) => (
                  <Link 
                    key={user.id}
                    href={`/creator/${user.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                      ${index === 0 ? 'bg-yellow-400 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-orange-400 text-black' : 
                        'bg-brand-border text-gray-400'}`}>
                      {index + 1}
                    </div>

                    {/* Avatar - FIXED */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-green to-brand-purple flex items-center justify-center overflow-hidden flex-shrink-0">
                      <AvatarImage url={user.avatar_url} name={user.username} size={48} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">
                        {user.username || 'Anonymous'}
                      </h3>
                      <p className="text-brand-green font-mono text-xs">
                        {shortenAddress(user.wallet_address, 6)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-brand-green font-bold">
                        {user.total_earned || 0} USDC
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.total_points || 0} pts
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
