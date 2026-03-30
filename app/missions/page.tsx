'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Search, Target, Clock, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import type { Mission } from '@/types/database'
import { timeUntil } from '@/lib/utils/helpers'

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      let q = (supabase.from('missions') as any).select('*').order('created_at', { ascending: false })
      if (filter !== 'all') q = q.eq('status', filter)
      const { data } = await q
      setMissions(data || [])
      setLoading(false)
    }
    load()
  }, [filter])

  const filtered = missions.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-brand-green/10 text-brand-green border-brand-green/20'
    if (s === 'funded') return 'bg-blue-500/10 text-blue-400 border-blue-400/20'
    if (s === 'completed') return 'bg-gray-500/10 text-gray-400 border-gray-400/20'
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20'
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-3">Available <span className="text-brand-green">Missions</span></h1>
          <p className="text-gray-400 text-lg">Browse and complete missions to earn rewards on Solana</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search missions..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'funded', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  filter === f ? 'bg-brand-green text-brand-dark font-bold' : 'bg-brand-card border border-brand-border text-gray-400 hover:border-brand-green/30'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-brand-card rounded-2xl border border-brand-border animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Target size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No missions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(mission => (
              <Link key={mission.id} href={`/missions/${mission.id}`}>
                <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden h-full card-hover shimmer flex flex-col">
                  {/* FIX: Add Image */}
                  <div className="h-40 bg-brand-dark relative overflow-hidden">
                    {mission.image_url ? (
                      <img 
                        src={mission.image_url} 
                        alt={mission.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <ImageIcon size={48} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(mission.status)}`}>
                        {mission.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-white text-lg line-clamp-2 flex-1">{mission.title}</h3>
                      <span className="text-brand-green font-black text-lg ml-2">{mission.reward_pool} {mission.currency}</span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">{mission.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-brand-border">
                      <span className="flex items-center gap-1"><Clock size={12} />{timeUntil(mission.deadline)} left</span>
                      <span className="flex items-center gap-1"><Target size={12} />Max {mission.max_winners} winners</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
