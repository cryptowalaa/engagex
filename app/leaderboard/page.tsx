'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Trophy, Users, Star } from 'lucide-react'
import { shortenAddress } from '@/lib/utils/helpers'

interface Engager {
  id: string
  wallet_address: string
  username: string | null
  total_points: number
  role: string
}

interface Creator {
  id: string
  wallet_address: string
  username: string | null
  total_earned: number
  role: string
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'engagers' | 'creators'>('engagers')
  const [engagers, setEngagers] = useState<Engager[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Load top engagers (by total_points)
      const { data: eData } = await (supabase.from('users') as any)
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50)
      
      // Load top creators (by total_earned)
      const { data: cData } = await (supabase.from('users') as any)
        .select('*')
        .order('total_earned', { ascending: false })
        .limit(50)
      
      setEngagers(eData || [])
      setCreators(cData || [])
      setLoading(false)
    }
    load()
  }, [])

  const rankColor = (i: number) => {
    if (i === 0) return 'bg-yellow-400/15 text-yellow-400'
    if (i === 1) return 'bg-gray-400/15 text-gray-400'
    if (i === 2) return 'bg-orange-400/15 text-orange-400'
    return 'bg-brand-border text-gray-500'
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black mb-3">
            <span className="text-brand-green">Leaderboard</span>
          </h1>
          <p className="text-gray-400">Top performers · Real-time rankings</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-3 mb-10">
          <button 
            onClick={() => setActiveTab('engagers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'engagers' 
                ? 'bg-brand-green text-brand-dark' 
                : 'bg-brand-card border border-brand-border text-gray-400 hover:border-brand-green/30'
            }`}
          >
            <Users size={16} />
            Top Engagers (20% Pool)
          </button>
          <button 
            onClick={() => setActiveTab('creators')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'creators' 
                ? 'bg-brand-green text-brand-dark' 
                : 'bg-brand-card border border-brand-border text-gray-400 hover:border-brand-green/30'
            }`}
          >
            <Star size={16} />
            Top Creators (60% Pool)
          </button>
        </div>

        {/* Engagers Leaderboard */}
        {activeTab === 'engagers' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-brand-border bg-brand-green/5">
              <p className="text-sm text-brand-green font-medium">🏆 Top 50 Engagers win from 20% reward pool</p>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading...</div>
            ) : engagers.length === 0 ? (
              <div className="p-10 text-center">
                <Trophy size={40} className="text-gray-700 mx-auto mb-3"/>
                <p className="text-gray-400">No engagers yet!</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-brand-border">
                  <tr>
                    {['Rank', 'User', 'Points'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {engagers.map((user, i) => (
                    <tr key={user.id} className="border-b border-brand-border/40 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${rankColor(i)}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-border flex items-center justify-center text-xs font-bold text-gray-400">
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.username || 'Anonymous'}</p>
                            <p className="font-mono text-brand-green text-xs">{shortenAddress(user.wallet_address, 6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-2xl font-black text-brand-green">{user.total_points || 0}</span>
                        <span className="text-xs text-gray-500 ml-1">pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Creators Leaderboard */}
        {activeTab === 'creators' && (
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-brand-border bg-brand-green/5">
              <p className="text-sm text-brand-green font-medium">🏆 Top 50 Creators win from 60% reward pool</p>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading...</div>
            ) : creators.length === 0 ? (
              <div className="p-10 text-center">
                <Trophy size={40} className="text-gray-700 mx-auto mb-3"/>
                <p className="text-gray-400">No creators yet!</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-brand-border">
                  <tr>
                    {['Rank', 'Creator', 'Earned'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creators.map((user, i) => (
                    <tr key={user.id} className="border-b border-brand-border/40 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${rankColor(i)}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-xs font-bold text-brand-green">
                            {user.username?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.username || 'Anonymous'}</p>
                            <p className="font-mono text-brand-green text-xs">{shortenAddress(user.wallet_address, 6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-2xl font-black text-brand-green">{user.total_earned || 0}</span>
                        <span className="text-xs text-gray-500 ml-1">USDC</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
