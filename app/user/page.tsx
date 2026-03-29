'use client'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { shortenAddress, formatUSDC, timeAgo } from '@/lib/utils/helpers'
import { Trophy, Target, Zap, TrendingUp, ArrowRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import type { User, Mission, Reward } from '@/types/database'

export default function UserDashboard() {
  const { publicKey } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [activeMissions, setActiveMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicKey) return
    const wallet = publicKey.toBase58()

    async function load() {
      // Upsert user on first visit
      const { data: userData } = await supabase
        .from('users')
        .upsert({ wallet_address: wallet }, { onConflict: 'wallet_address' })
        .select()
        .single()
      setUser(userData)

      // Get rewards
      if (userData) {
        const { data: rewardData } = await supabase
          .from('rewards')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setRewards(rewardData || [])
      }

      // Get active missions
      const { data: missionData } = await supabase
        .from('missions')
        .select('*')
        .eq('status', 'active')
        .order('deadline', { ascending: true })
        .limit(4)
      setActiveMissions(missionData || [])

      setLoading(false)
    }

    load()
  }, [publicKey])

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center">
          <Wallet size={36} className="text-brand-green" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your Solana wallet to access your dashboard</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-brand-card rounded-2xl border border-brand-border" />
        ))}
      </div>
    )
  }

  const statCards = [
    { label: 'Total Earned', value: formatUSDC(user?.total_earned || 0), icon: Trophy, color: 'text-brand-green' },
    { label: 'Active Missions', value: activeMissions.length, icon: Target, color: 'text-brand-purple' },
    { label: 'Rewards Pending', value: rewards.filter(r => r.status === 'pending').length, icon: Zap, color: 'text-yellow-400' },
    { label: 'Wallet', value: shortenAddress(publicKey.toBase58()), icon: Wallet, color: 'text-blue-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-1">
          Welcome back <span className="text-brand-green">◎</span>
        </h1>
        <p className="text-gray-400 font-mono text-sm">{publicKey.toBase58()}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Active Missions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Active Missions</h2>
          <Link href="/creator/missions" className="text-brand-green text-sm flex items-center gap-1 hover:underline">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMissions.length === 0 ? (
            <div className="col-span-2 bg-brand-card border border-brand-border rounded-2xl p-10 text-center text-gray-500">
              No active missions yet. Check back soon!
            </div>
          ) : activeMissions.map(mission => (
            <Link key={mission.id} href={`/missions/${mission.id}`}
              className="bg-brand-card border border-brand-border rounded-2xl p-5 card-hover block">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white">{mission.title}</h3>
                <span className="text-brand-green font-bold text-sm">{mission.reward_pool} {mission.currency}</span>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">{mission.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Ends: {new Date(mission.deadline).toLocaleDateString()}</span>
                <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full border border-brand-green/20">
                  {mission.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Rewards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Rewards</h2>
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          {rewards.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No rewards yet. Complete missions to earn!
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-brand-border">
                <tr>
                  {['Type', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rewards.map(reward => (
                  <tr key={reward.id} className="border-b border-brand-border/50 hover:bg-white/2">
                    <td className="px-4 py-3 capitalize text-gray-300">{reward.reward_type}</td>
                    <td className="px-4 py-3 text-brand-green font-bold">{reward.amount} USDC</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        reward.status === 'paid' ? 'bg-brand-green/10 text-brand-green' :
                        reward.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {reward.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{timeAgo(reward.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
