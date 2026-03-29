'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { useSubmissions } from '@/hooks/use-submissions'
import { useMissions } from '@/hooks/use-missions'
import { Trophy, FileText, Target, Wallet } from 'lucide-react'
import { formatUSDC, shortenAddress } from '@/lib/utils/helpers'
import Link from 'next/link'

export default function CreatorDashboard() {
  const { user } = useUser()
  const { submissions } = useSubmissions(undefined, user?.id)
  const { missions } = useMissions('active')
  const winners = submissions.filter(s => s.status === 'winner').length
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-black">Creator <span className="text-brand-green">Dashboard</span></h1>
            {user && <p className="text-gray-500 font-mono text-xs mt-1">{shortenAddress(user.wallet_address, 8)}</p>}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Earned', value: formatUSDC(user?.total_earned || 0), icon: Trophy, color: 'text-brand-green' },
              { label: 'Submissions', value: submissions.length, icon: FileText, color: 'text-brand-purple' },
              { label: 'Wins', value: winners, icon: Trophy, color: 'text-yellow-400' },
              { label: 'Active Missions', value: missions.length, icon: Target, color: 'text-blue-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-5">
                <div className="flex justify-between mb-3"><span className="text-gray-400 text-sm">{label}</span><Icon size={16} className={color} /></div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <h2 className="font-bold mb-4 text-lg">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/creator/missions" className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:border-brand-green/30 hover:bg-brand-green/5 transition-all">
                  <Target size={18} className="text-brand-green" /><span className="text-sm font-medium">Browse Active Missions</span>
                </Link>
                <Link href="/creator/submissions" className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:border-brand-purple/30 hover:bg-brand-purple/5 transition-all">
                  <FileText size={18} className="text-brand-purple" /><span className="text-sm font-medium">View My Submissions</span>
                </Link>
                <Link href="/leaderboard" className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all">
                  <Trophy size={18} className="text-yellow-400" /><span className="text-sm font-medium">Leaderboard Rankings</span>
                </Link>
              </div>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <h2 className="font-bold mb-4 text-lg">Recent Submissions</h2>
              {submissions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No submissions yet</p>
              ) : submissions.slice(0, 4).map(sub => (
                <div key={sub.id} className="flex justify-between items-center py-2 border-b border-brand-border/50 last:border-0">
                  <span className="text-sm text-gray-300 truncate flex-1">{(sub as any).mission?.title || 'Mission'}</span>
                  <span className="text-brand-green font-bold text-sm ml-2">{sub.score.toFixed(0)}pts</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
