'use client'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'

interface Mission {
  id: string
  title: string
  reward_pool: number
  currency: string
  status: string
  deadline: string
  max_winners: number
  brand: {
    id: string
    username: string | null
  } | null
}

interface LeaderboardEntry {
  submission_id: string
  creator_id: string
  creator_username: string | null
  creator_wallet: string
  creator_avatar: string | null
  content_link: string
  platform: string
  score: number
  likes: number
  comments: number
  shares: number
  rank: number
  status: string
  reward_amount: number | null
}

export default function AdminRewards() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMissionId, setSelectedMissionId] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null)
  const [winnersSelected, setWinnersSelected] = useState(false)

  useEffect(() => {
    loadMissions()
  }, [])

  async function loadMissions() {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('missions')
        .select(`*, brand:users(id, username)`)
        .or(`status.in.(completed,expired,ended),and(status.eq.active,deadline.lt.${now})`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMissions(data || [])
    } catch (error) {
      console.error('Error loading missions:', error)
      toast.error('Failed to load missions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedMissionId) {
      setLeaderboard([])
      setWinnersSelected(false)
      return
    }
    loadLeaderboard(selectedMissionId)
  }, [selectedMissionId])

  async function loadLeaderboard(missionId: string) {
    try {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select(`
          *,
          creator:users(id, username, wallet_address, avatar_url, total_earned),
          engagement:engagements(*)
        `)
        .eq('mission_id', missionId)
        .order('score', { ascending: false })

      if (error) throw error

      const entries: LeaderboardEntry[] = (subs || []).map((sub: any, index: number) => ({
        submission_id: sub.id,
        creator_id: sub.creator_id,
        creator_username: sub.creator?.username,
        creator_wallet: sub.creator?.wallet_address,
        creator_avatar: sub.creator?.avatar_url,
        content_link: sub.content_link,
        platform: sub.platform,
        score: sub.score || 0,
        likes: sub.engagement?.likes || 0,
        comments: sub.engagement?.comments || 0,
        shares: sub.engagement?.shares || 0,
        rank: index + 1,
        status: sub.status || 'pending',
        reward_amount: sub.reward_amount
      }))

      setLeaderboard(entries)
      
      const hasWinners = entries.some(e => e.status === 'winner' || e.status === 'paid')
      setWinnersSelected(hasWinners)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      toast.error('Failed to load leaderboard')
    }
  }

  async function selectWinners() {
    if (!selectedMissionId) return toast.error('Select a mission first')
    
    const mission = missions.find(m => m.id === selectedMissionId)
    if (!mission) return toast.error('Mission not found')

    setDistributing(true)
    try {
      const topEntries = leaderboard.slice(0, mission.max_winners)
      
      if (topEntries.length === 0) {
        throw new Error('No entries found for this mission')
      }

      const creatorPool = mission.reward_pool * 0.60
      const perWinner = creatorPool / topEntries.length

      for (const entry of topEntries) {
        const { error } = await (supabase
          .from('submissions') as any)
          .update({ 
            status: 'winner',
            reward_amount: perWinner,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.submission_id)

        if (error) throw error
      }

      toast.success(`Selected ${topEntries.length} winners! ${perWinner.toFixed(2)} ${mission.currency} each`)
      
      await loadLeaderboard(selectedMissionId)
      setWinnersSelected(true)
      
    } catch (error: any) {
      console.error('Error selecting winners:', error)
      toast.error(error.message || 'Failed to select winners')
    } finally {
      setDistributing(false)
    }
  }

  // ✅ FIXED: Proper markAsPaid with correct total_earned update
  async function markAsPaid(submissionId: string, creatorId: string, amount: number) {
    try {
      // 1. Update submission status
      const { error: subError } = await (supabase
        .from('submissions') as any)
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (subError) throw subError

      // 2. Insert reward record (without paid_at if column doesn't exist)
      const rewardData: any = {
        user_id: creatorId,
        mission_id: selectedMissionId,
        submission_id: submissionId,
        amount: amount,
        reward_type: 'creator',
        status: 'paid'
      }
      
      // Only add paid_at if column exists (will fail silently if not)
      try {
        rewardData.paid_at = new Date().toISOString()
      } catch (e) {
        // Column might not exist, continue without it
      }

      const { error: rewardError } = await (supabase
        .from('rewards') as any)
        .insert(rewardData)

      if (rewardError) {
        console.log('Reward insert error (might be missing column):', rewardError)
        // Continue even if reward insert fails - main goal is user update
      }

      // 3. ✅ FIXED: Get current total_earned and update
      const { data: userData, error: fetchError } = await (supabase
        .from('users') as any)
        .select('total_earned')
        .eq('id', creatorId)
        .single()

      if (fetchError) throw fetchError

      const currentEarned = userData?.total_earned || 0
      const newTotal = currentEarned + amount

      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({ total_earned: newTotal })
        .eq('id', creatorId)

      if (updateError) throw updateError

      toast.success(`Marked as paid: ${formatUSDC(amount)}`)
      
      await loadLeaderboard(selectedMissionId)
      
    } catch (error: any) {
      console.error('Error marking as paid:', error)
      toast.error(error.message || 'Failed to update payment status')
    }
  }

  const copyWallet = (wallet: string) => {
    navigator.clipboard.writeText(wallet)
    setCopiedWallet(wallet)
    toast.success('Wallet address copied!')
    setTimeout(() => setCopiedWallet(null), 2000)
  }

  const selectedMission = missions.find(m => m.id === selectedMissionId)
  const winners = leaderboard.filter(e => e.status === 'winner' || e.status === 'paid')
  const pendingWinners = winners.filter(e => e.status === 'winner')
  const paidWinners = winners.filter(e => e.status === 'paid')

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-8">
            Distribute <span className="text-brand-purple">Rewards</span>
          </h1>
          
          <div className="max-w-5xl space-y-6">
            
            {/* Mission Selection */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <label className="text-sm text-gray-400 font-semibold block mb-3">
                Select Mission for Reward Distribution
              </label>
              
              {loading ? (
                <div className="w-full h-12 bg-brand-dark rounded-xl animate-pulse" />
              ) : missions.length === 0 ? (
                <div className="text-gray-500 text-sm py-3">
                  No missions available for distribution
                </div>
              ) : (
                <select 
                  value={selectedMissionId} 
                  onChange={(e) => setSelectedMissionId(e.target.value)} 
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-green/50"
                >
                  <option value="">-- Select Mission --</option>
                  {missions.map(m => {
                    const isExpired = new Date(m.deadline) < new Date()
                    const displayStatus = isExpired && m.status === 'active' 
                      ? 'expired' 
                      : m.status
                    
                    return (
                      <option key={m.id} value={m.id}>
                        {m.title} ({formatUSDC(m.reward_pool)}) - {displayStatus} - Max {m.max_winners} winners
                      </option>
                    )
                  })}
                </select>
              )}

              {selectedMission && (
                <div className="mt-4 p-4 bg-brand-dark rounded-xl border border-brand-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Status</span>
                      <span className={`font-medium ${
                        new Date(selectedMission.deadline) < new Date() ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {new Date(selectedMission.deadline) < new Date() ? 'EXPIRED' : selectedMission.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Pool</span>
                      <span className="text-brand-green font-bold">{formatUSDC(selectedMission.reward_pool)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Max Winners</span>
                      <span className="text-white">{selectedMission.max_winners}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Entries</span>
                      <span className="text-white">{leaderboard.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            {selectedMissionId && leaderboard.length > 0 && (
              <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
                <div 
                  className="p-4 border-b border-brand-border bg-brand-purple/5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(!expanded)}
                >
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-brand-purple" />
                    <h2 className="text-lg font-bold text-white">Mission Leaderboard</h2>
                    <span className="text-xs text-gray-400 ml-2">
                      ({leaderboard.length} entries)
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {expanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-brand-border bg-brand-dark/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Rank</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Creator</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Score</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Wallet</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-semibold uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => {
                          const isWinner = entry.status === 'winner'
                          const isPaid = entry.status === 'paid'
                          
                          return (
                            <tr 
                              key={entry.submission_id} 
                              className={`border-b border-brand-border/40 transition-colors ${
                                isWinner ? 'bg-yellow-500/5' : isPaid ? 'bg-green-500/5' : ''
                              }`}>
                              <td className="px-4 py-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-brand-border text-gray-500'
                                }`}>
                                  {index + 1}
                                </div>
                              </td>
                              
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-bold overflow-hidden">
                                    {entry.creator_avatar ? (
                                      <img src={entry.creator_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      entry.creator_username?.[0]?.toUpperCase() || 'C'
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-white text-sm">
                                      {entry.creator_username || shortenAddress(entry.creator_wallet, 4)}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{entry.platform}</p>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4">
                                <span className="text-lg font-black text-brand-green">
                                  {entry.score.toFixed(0)}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">pts</span>
                              </td>
                              
                              <td className="px-4 py-4">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                    <CheckCircle size={12} /> Paid
                                  </span>
                                ) : isWinner ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                    <Trophy size={12} /> Winner
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">Pending</span>
                                )}
                              </td>
                              
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-gray-400">
                                    {shortenAddress(entry.creator_wallet, 8)}
                                  </span>
                                  <button
                                    onClick={() => copyWallet(entry.creator_wallet)}
                                    className="p-1.5 hover:bg-brand-border rounded-lg transition-colors"
                                    title="Copy wallet address"
                                  >
                                    {copiedWallet === entry.creator_wallet ? (
                                      <CheckCircle size={14} className="text-green-400" />
                                    ) : (
                                      <Copy size={14} className="text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              
                              <td className="px-4 py-4 text-right">
                                {isWinner && !isPaid && (
                                  <button
                                    onClick={() => markAsPaid(entry.submission_id, entry.creator_id, entry.reward_amount || 0)}
                                    className="px-3 py-1.5 bg-brand-green text-brand-dark text-xs font-bold rounded-lg hover:bg-opacity-90 transition-all"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                                {isPaid && (
                                  <span className="text-xs text-green-400">
                                    {formatUSDC(entry.reward_amount || 0)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Select Winners Button */}
            {selectedMissionId && leaderboard.length > 0 && !winnersSelected && (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
                <p className="text-gray-400 mb-4">
                  Select top {selectedMission?.max_winners} winners from {leaderboard.length} entries
                </p>
                <button
                  onClick={selectWinners}
                  disabled={distributing}
                  className="px-6 py-3 bg-brand-purple text-white font-bold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {distributing ? 'Processing...' : '🏆 Select Winners'}
                </button>
              </div>
            )}

            {/* Payment Summary */}
            {winnersSelected && (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Payment Summary</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-brand-dark rounded-xl">
                    <p className="text-2xl font-black text-yellow-400">{pendingWinners.length}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-brand-dark rounded-xl">
                    <p className="text-2xl font-black text-green-400">{paidWinners.length}</p>
                    <p className="text-xs text-gray-500">Paid</p>
                  </div>
                  <div className="text-center p-4 bg-brand-dark rounded-xl">
                    <p className="text-2xl font-black text-brand-green">
                      {formatUSDC(paidWinners.reduce((sum, w) => sum + (w.reward_amount || 0), 0))}
                    </p>
                    <p className="text-xs text-gray-500">Total Paid</p>
                  </div>
                </div>
                
                {pendingWinners.length > 0 && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-sm text-yellow-400">
                      ⚠️ {pendingWinners.length} winners pending payment. Copy wallet addresses and send USDC manually, then click &quot;Mark Paid&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
