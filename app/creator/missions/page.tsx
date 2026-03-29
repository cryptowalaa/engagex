'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useMissions } from '@/hooks/use-missions'
import { timeUntil } from '@/lib/utils/helpers'
import { Target, Clock } from 'lucide-react'
import Link from 'next/link'

export default function CreatorMissions() {
  const { missions, loading } = useMissions('active')
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-2">Browse <span className="text-brand-green">Missions</span></h1>
          <p className="text-gray-400 mb-8">Pick a mission and submit your content to earn rewards</p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-brand-card rounded-2xl border border-brand-border animate-pulse" />)}
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-20">
              <Target size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">No active missions right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {missions.map(m => (
                <Link key={m.id} href={`/missions/${m.id}`}>
                  <div className="bg-brand-card border border-brand-border rounded-2xl p-5 h-full card-hover flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-1 rounded-full">{m.status}</span>
                      <span className="font-black text-brand-green">{m.reward_pool} {m.currency}</span>
                    </div>
                    <h3 className="font-bold text-white mb-2 line-clamp-2">{m.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{m.description}</p>
                    <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-brand-border">
                      <span className="flex items-center gap-1"><Clock size={11} />{timeUntil(m.deadline)} left</span>
                      <span className="flex items-center gap-1"><Target size={11} />{m.max_winners} winners</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
