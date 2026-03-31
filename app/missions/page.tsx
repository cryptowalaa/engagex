'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Search, Clock, Users, CheckCircle, Target } from 'lucide-react'
import { formatUSDC, timeUntil } from '@/lib/utils/helpers'
import Link from 'next/link'

type MissionStatus = 'all' | 'active' | 'funded' | 'completed'

interface Mission {
  id: string
  title: string
  description: string
  reward_pool: number
  currency: string
  deadline: string
  status: string
  max_winners: number
  image_url: string | null
  category: string
  brand: {
    username: string | null
    wallet_address: string
    is_verified: boolean
    is_official_verified: boolean  // ✅ NEW: Yellow tick
  } | null
}

// Yellow Tick Component (Twitter/X style)
function YellowTick({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4'
  }

  return (
    <span 
      className={`inline-flex items-center justify-center ${sizeClasses[size]} bg-[#FFAD1F] rounded-full text-white`}
      title="Official Verified Brand"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full p-[1.5px]">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </span>
  )
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<MissionStatus>('all')

  useEffect(() => {
    loadMissions()
  }, [])

  useEffect(() => {
    filterMissions()
  }, [missions, searchQuery, activeFilter])

  async function loadMissions() {
    try {
      const { data } = await (supabase.from('missions') as any)
        .select(`
          *,
          brand:users(id, username, wallet_address, is_verified, is_official_verified)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setMissions(data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterMissions() {
    let filtered = missions

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => m.status === activeFilter)
    }

    setFilteredMissions(filtered)
  }

  const filters: { label: string; value: MissionStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Funded', value: 'funded' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-3">
              Available <span className="text-brand-green">Missions</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Browse and complete missions to earn rewards on Solana
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-card border border-brand-border rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"
              />
            </div>
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeFilter === filter.value
                      ? 'bg-brand-green text-brand-dark'
                      : 'bg-brand-card border border-brand-border text-gray-400 hover:border-brand-green/30'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Missions Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-brand-card rounded-2xl animate-pulse border border-brand-border" />
              ))}
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="text-center py-20">
              <Target size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No missions found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMissions.map((mission) => (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="group bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-green/30 transition-all duration-300 card-hover"
                >
                  {/* Image */}
                  <div className="h-48 bg-brand-dark relative overflow-hidden">
                    {mission.image_url ? (
                      <img
                        src={mission.image_url}
                        alt={mission.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Target size={48} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-brand-green/90 text-brand-dark text-xs font-bold rounded-full">
                        {mission.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Brand Info with BOTH Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center text-xs text-brand-purple font-bold">
                        {mission.brand?.username?.[0]?.toUpperCase() || 'B'}
                      </div>
                      <span className="text-sm text-gray-400">
                        {mission.brand?.username || 'Anonymous'}
                      </span>
                      
                      {/* 🟢 Green Verified Badge (Approved brand) */}
                      {mission.brand?.is_verified && !mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-0.5 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-1.5 py-0.5 rounded">
                          <CheckCircle size={10} className="fill-current" />
                          <span className="text-[10px]">Verified</span>
                        </span>
                      )}
                      
                      {/* 🟡 Yellow Official Badge (Premium/Subscription) */}
                      {mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-1 text-xs">
                          <YellowTick size="sm" />
                          <span className="text-[#FFAD1F] font-semibold text-[10px]">Official</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-brand-green transition-colors">
                      {mission.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {mission.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reward Pool</p>
                        <p className="text-brand-green font-black text-lg">
                          {formatUSDC(mission.reward_pool)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                          <Clock size={12} />
                          {timeUntil(mission.deadline)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Users size={12} />
                          Max {mission.max_winners} winners
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
