'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Search, Clock, Users, CheckCircle, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatUSDC, timeUntil } from '@/lib/utils/helpers'
import Link from 'next/link'
import Image from 'next/image'

function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return imageUrl
  const cleanPath = imageUrl.replace(/^(avatars|missions)\//, '')
  return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`
}

function getAvatarUrl(imageUrl: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return imageUrl
  const cleanPath = imageUrl.replace(/^avatars\//, '')
  return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`
}

type MissionStatus = 'all' | 'active' | 'funded' | 'completed' | 'expired'

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
    id: string
    username: string | null
    wallet_address: string
    is_verified: boolean
    is_official_verified: boolean
    avatar_url: string | null
    logo_url: string | null
  } | null
}

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

function AvatarImage({ url, name, size = 24 }: { url: string | null, name: string | null, size?: number }) {
  const [error, setError] = useState(false)
  
  if (!url || error) {
    return (
      <span className="text-xs font-bold text-white flex items-center justify-center w-full h-full">
        {name?.[0]?.toUpperCase() || 'B'}
      </span>
    )
  }
  
  return (
    <img 
      src={url.startsWith('http') ? url : getAvatarUrl(url)} 
      alt={name || 'Brand'} 
      className="object-cover w-full h-full"
      onError={() => setError(true)}
    />
  )
}

function isMissionExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

function getDisplayStatus(mission: Mission): { status: string; isExpired: boolean } {
  const expired = isMissionExpired(mission.deadline)
  return {
    status: expired ? 'expired' : mission.status,
    isExpired: expired
  }
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
          brand:users(id, username, wallet_address, is_verified, is_official_verified, avatar_url, logo_url)
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

    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => {
        const { status } = getDisplayStatus(m)
        return status === activeFilter
      })
    }

    setFilteredMissions(filtered)
  }

  const filters: { label: string; value: MissionStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Expired', value: 'expired' },
    { label: 'Funded', value: 'funded' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            Available <span className="text-emerald-400">Missions</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Browse and complete missions to earn rewards on Solana
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search missions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter.value
                    ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-900/70 backdrop-blur-md border border-gray-800 text-gray-400 hover:border-emerald-500/30 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-900/50 backdrop-blur-sm rounded-2xl animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
              <Target size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg">No missions found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMissions.map((mission, index) => {
              const { status: displayStatus, isExpired } = getDisplayStatus(mission)
              
              return (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="group block bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 bg-gray-950 relative overflow-hidden">
                    {mission.image_url ? (
                      <Image
                        src={getImageUrl(mission.image_url)}
                        alt={mission.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                        }}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-800">
                        <Target size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md ${
                        isExpired 
                          ? 'bg-red-500/90 text-white' 
                          : 'bg-emerald-500/90 text-gray-950'
                      }`}>
                        {isExpired ? 'Expired' : 'ACTIVE'}
                      </span>
                      {mission.category && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-black/50 backdrop-blur-md text-gray-300 border border-white/10">
                          {mission.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Link 
                        href={`/brand/${mission.brand?.id}`}
                        className="flex items-center gap-2 group/brand"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold group-hover/brand:scale-110 transition-transform overflow-hidden border border-white/10">
                          <AvatarImage 
                            url={mission.brand?.logo_url || mission.brand?.avatar_url} 
                            name={mission.brand?.username} 
                            size={28} 
                          />
                        </div>
                        <span className="text-sm text-gray-400 group-hover/brand:text-emerald-400 transition-colors">
                          {mission.brand?.username || 'Anonymous'}
                        </span>
                      </Link>
                      
                      {mission.brand?.is_verified && !mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          <CheckCircle size={10} className="fill-current" />
                          <span className="text-[10px]">Verified</span>
                        </span>
                      )}
                      
                      {mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-1 text-xs">
                          <YellowTick size="sm" />
                          <span className="text-[#FFAD1F] font-semibold text-[10px]">Official</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors duration-300">
                      {mission.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {mission.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reward Pool</p>
                        <p className="text-emerald-400 font-black text-lg">
                          {formatUSDC(mission.reward_pool)} <span className="text-sm text-emerald-500">{mission.currency || 'USDC'}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`flex items-center gap-1.5 text-xs ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                          <Clock size={12} />
                          {isExpired ? 'Expired' : timeUntil(mission.deadline)}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Users size={12} />
                          Max {mission.max_winners} winners
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
