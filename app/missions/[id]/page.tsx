'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { SubmissionForm } from '@/components/submissions/submission-form'
import { Clock, Users, Trophy, ExternalLink } from 'lucide-react'
import { timeUntil, timeAgo, formatUSDC, shortenAddress } from '@/lib/utils/helpers'
import Link from 'next/link'

export default function MissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { publicKey } = useWallet()
  const [mission, setMission] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data: m } = await supabase.from('missions').select('*').eq('id', id).single()
      setMission(m)
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, creator:users(id, username, wallet_address)')
        .eq('mission_id', id)
        .order('score', { ascending: false })
      setSubmissions(subs || [])
      if (publicKey) {
        const { data: u } = await supabase.from('users').select('id').eq('wallet_address', publicKey.toBase58()).single()
        if (u) {
          const { data: mine } = await supabase.from('submissions').select('id').eq('mission_id', id).eq('creator_id', u.id).single()
          setHasSubmitted(!!mine)
        }
      }
      setLoading(false)
    }
    load()
  }, [id, publicKey])

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!mission) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-white font-bold text-xl mb-2">Mission not found</h2>
        <Link href="/missions" className="text-brand-green">← Back to missions</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full">{mission.status}</span>
                  <span className="text-xs text-gray-500">{mission.category}</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-4">{mission.title}</h1>
                <p className="text-gray-300 leading-relaxed mb-6">{mission.description}</p>
                {mission.requirements && (
                  <div className="bg-brand-dark rounded-xl p-4 border border-brand-border">
                    <h3 className="text-white font-semibold mb-2 text-sm">Requirements</h3>
                    <p className="text-gray-400 text-sm">{mission.requirements}</p>
                  </div>
                )}
              </div>

              {submissions.length > 0 && (
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                  <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" /> Top Submissions
                  </h2>
                  <div className="space-y-3">
                    {submissions.slice(0, 10).map((sub, i) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-brand-dark rounded-xl border border-brand-border">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-gray-400 text-black':i===2?'bg-orange-500 text-black':'bg-brand-border text-gray-400'}`}>{i+1}</span>
                          <div>
                            <p className="text-white text-sm font-medium">{sub.creator?.username || shortenAddress(sub.creator?.wallet_address || '', 4)}</p>
                            <span className="text-xs text-gray-500">{sub.platform}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-brand-green font-bold text-sm">{Number(sub.score).toFixed(0)} pts</span>
                          <a href={sub.content_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-green transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-brand-border">
                  <span className="text-gray-400 text-sm">Reward Pool</span>
                  <span className="text-brand-green font-bold">{mission.reward_pool} {mission.currency}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-brand-border">
                  <span className="text-gray-400 text-sm flex items-center gap-1"><Clock size={13} />Deadline</span>
                  <span className="text-yellow-400 text-sm font-medium">{timeUntil(mission.deadline)} left</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-brand-border">
                  <span className="text-gray-400 text-sm flex items-center gap-1"><Users size={13} />Max Winners</span>
                  <span className="text-white text-sm">{mission.max_winners}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400 text-sm">Submissions</span>
                  <span className="text-white text-sm">{submissions.length}</span>
                </div>
              </div>

              <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                <h2 className="text-white font-bold mb-4">Submit Your Entry</h2>
                {hasSubmitted ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-brand-green font-semibold">Already Submitted!</p>
                    <p className="text-gray-400 text-sm mt-1">Your entry is under review</p>
                  </div>
                ) : (
                  <SubmissionForm missionId={id} onSuccess={() => setHasSubmitted(true)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
