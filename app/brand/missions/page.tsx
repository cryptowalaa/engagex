'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { useMissions } from '@/hooks/use-missions'
import { Target, Plus } from 'lucide-react'
import { timeUntil } from '@/lib/utils/helpers'
import Link from 'next/link'

export default function BrandMissions() {
  const { user } = useUser()
  const { missions, loading } = useMissions()
  const myMissions = missions.filter(m => m.brand_id === user?.id)
  const statusColor = (s: string) => ({ active: 'text-brand-green bg-brand-green/10 border-brand-green/20', draft: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', funded: 'text-blue-400 bg-blue-400/10 border-blue-400/20', completed: 'text-gray-400 bg-gray-400/10 border-gray-400/20', cancelled: 'text-red-400 bg-red-400/10 border-red-400/20' }[s] || '')
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-black">My <span className="text-brand-purple">Missions</span></h1><p className="text-gray-400 mt-1">Manage your launched campaigns</p></div>
            <Link href="/brand/missions/create" className="flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all text-sm"><Plus size={16} /> New Mission</Link>
          </div>
          {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-brand-card rounded-2xl border border-brand-border animate-pulse" />)}</div>
          : myMissions.length === 0 ? (
            <div className="text-center py-20 bg-brand-card border border-dashed border-brand-border rounded-2xl">
              <Target size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No missions created yet</p>
              <Link href="/brand/missions/create" className="inline-flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-6 py-3 rounded-xl text-sm"><Plus size={16} /> Create Mission</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myMissions.map(m => (
                <div key={m.id} className="bg-brand-card border border-brand-border rounded-2xl p-6 card-hover">
                  <div className="flex justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(m.status)}`}>{m.status}</span>
                    <span className="font-black text-brand-green text-lg">{m.reward_pool} {m.currency}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{m.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{m.description}</p>
                  <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-brand-border">
                    <span>{timeUntil(m.deadline)} left</span><span>Max {m.max_winners} winners</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
