'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { useMissions } from '@/hooks/use-missions'
import { Target, Plus, TrendingUp } from 'lucide-react'
import { formatUSDC, timeUntil } from '@/lib/utils/helpers'
import Link from 'next/link'

export default function BrandDashboard() {
  const { user } = useUser()
  const { missions } = useMissions()
  const myMissions = missions.filter(m => m.brand_id === user?.id)
  const totalPool = myMissions.reduce((sum, m) => sum + m.reward_pool, 0)
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">Brand <span className="text-brand-purple">Dashboard</span></h1>
            <Link href="/brand/missions/create" className="flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all text-sm">
              <Plus size={16} /> Create Mission
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'My Missions', value: myMissions.length, color: 'text-brand-purple', icon: Target },
              { label: 'Active', value: myMissions.filter(m => m.status === 'active').length, color: 'text-brand-green', icon: TrendingUp },
              { label: 'Total Pool', value: formatUSDC(totalPool), color: 'text-yellow-400', icon: Target },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-5">
                <div className="flex justify-between mb-3"><span className="text-gray-400 text-sm">{label}</span><Icon size={16} className={color} /></div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Missions</h2>
              <Link href="/brand/missions" className="text-brand-green text-sm">View All →</Link>
            </div>
            {myMissions.length === 0 ? (
              <div className="bg-brand-card border border-dashed border-brand-border rounded-2xl p-12 text-center">
                <Target size={40} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No missions yet. Launch your first campaign!</p>
                <Link href="/brand/missions/create" className="inline-flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-6 py-3 rounded-xl text-sm hover:bg-opacity-90 transition-all">
                  <Plus size={16} /> Create First Mission
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myMissions.map(m => (
                  <div key={m.id} className="bg-brand-card border border-brand-border rounded-2xl p-5 card-hover">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full">{m.status}</span>
                      <span className="font-black text-brand-green">{m.reward_pool} {m.currency}</span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{m.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{m.description}</p>
                    <p className="text-xs text-gray-500">{timeUntil(m.deadline)} remaining</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
