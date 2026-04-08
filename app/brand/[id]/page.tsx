'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Target, ExternalLink, CheckCircle, Globe, Award, TrendingUp } from 'lucide-react'
import { shortenAddress, formatUSDC, timeUntil } from '@/lib/utils/helpers'
import Link from 'next/link'
import Image from 'next/image'
import { FollowButton } from '@/components/follow/follow-button'
import { FollowStats } from '@/components/follow/follow-stats'
import { useWallet } from '@solana/wallet-adapter-react'

// Inline getImageUrl function
function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return imageUrl
  const cleanPath = imageUrl.replace(/^(avatars|missions)\//, '')
  return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`
}

interface BrandProfile {
  id: string
  username: string | null
  wallet_address: string
  avatar_url: string | null
  logo_url: string | null
  bio: string | null
  twitter_handle: string | null
  discord_handle: string | null
  website_url: string | null
  is_verified: boolean
  is_official_verified: boolean
  total_earned: number
  followers_count: number
  following_count: number
  created_at: string
}

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
  created_at: string
}

// Check if mission is expired
function isMissionExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

// Get display status
function getDisplayStatus(mission: Mission): { status: string; isExpired: boolean } {
  const expired = isMissionExpired(mission.deadline)
  return {
    status: expired ? 'expired' : mission.status,
    isExpired: expired
  }
}

export default function BrandProfilePage() {
  const params = useParams()
  const brandId = params.id as string
  const { publicKey } = useWallet()
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (!brandId) return
    loadBrandProfile()
  }, [brandId])

  useEffect(() => {
    if (publicKey) {
      loadCurrentUser()
    }
  }, [publicKey])

  async function loadCurrentUser() {
    const { data } = await (supabase.from('users') as any)
      .select('id')
      .eq('wallet_address', publicKey?.toBase58())
      .single()
    setCurrentUser(data)
  }

  async function loadBrandProfile() {
    setLoading(true)
    try {
      // Load brand info with follow counts
      const { data: brandData } = await (supabase.from('users') as any)
        .select('*, followers_count, following_count')
        .eq('id', brandId)
        .single()
      
      setBrand(brandData)

      // Load brand's missions
      const { data: missionsData } = await (supabase.from('missions') as any)
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

      setMissions(missionsData || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-white font-bold text-xl mb-2">Brand not found</h2>
          <Link href="/missions" className="text-brand-green">← Back to missions</Link>
        </div>
      </div>
    )
  }

  const activeMissions = missions.filter(m => {
    const { isExpired } = getDisplayStatus(m)
    return !isExpired && m.status === 'active'
  })
  const completedMissions = missions.filter(m => {
    const { isExpired } = getDisplayStatus(m)
    return isExpired || m.status === 'completed'
  })

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/missions" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors mb-6"
          >
            ← Back to Missions
          </Link>

          {/* Brand Header */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Brand Avatar */}
              <div className="w-24 h-24 rounded-2xl border-2 border-brand-green flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple text-brand-dark font-black text-4xl overflow-hidden flex-shrink-0">
                {brand.logo_url || brand.avatar_url ? (
                  <Image 
                    src={getImageUrl(brand.logo_url || brand.avatar_url)} 
                    alt={brand.username || 'Brand'} 
                    width={96} 
                    height={96}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                    unoptimized
                  />
                ) : (
                  brand.username?.[0]?.toUpperCase() || 'B'
                )}
              </div>

              {/* Brand Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-3xl font-black text-white">
                    {brand.username || 'Anonymous Brand'}
                  </h1>
                  
                  {/* Verification Badges */}
                  {brand.is_official_verified && (
                    <span className="flex items-center gap-1 text-xs bg-[#FFAD1F]/10 text-[#FFAD1F] border border-[#FFAD1F]/20 px-2 py-0.5 rounded-full">
                      <span className="w-3 h-3 bg-[#FFAD1F] rounded-full flex items-center justify-center text-[8px] text-brand-dark font-bold">✓</span>
                      Official
                    </span>
                  )}
                  {brand.is_verified && !brand.is_official_verified && (
                    <span className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} className="fill-current" />
                      Verified
                    </span>
                  )}
                  
                  {/* Follow Button - نیا */}
                  {currentUser && currentUser.id !== brand.id && (
                    <FollowButton 
                      targetUserId={brand.id}
                      currentUserId={currentUser.id}
                      size="md"
                      showCount={true}
                      followerCount={brand.followers_count || 0}
                    />
                  )}
                </div>
                
                <p className="text-brand-green font-mono text-sm mb-3">
                  {shortenAddress(brand.wallet_address, 8)}
                </p>

                {/* Follow Stats - نیا */}
                <div className="mb-4">
                  <FollowStats 
                    followersCount={brand.followers_count || 0}
                    followingCount={brand.following_count || 0}
                    compact={true}
                  />
                </div>

                {brand.bio && (
                  <p className="text-gray-400 max-w-2xl mb-4">{brand.bio}</p>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap gap-3">
                  {brand.website_url && (
                    <a 
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300 hover:text-brand-green hover:border-brand-green/30 transition-all"
                    >
                      <Globe size={16} />
                      Website
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {brand.twitter_handle && (
                    <a 
                      href={`https://x.com/${brand.twitter_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300 hover:text-brand-green hover:border-brand-green/30 transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      @{brand.twitter_handle.replace('@', '')}
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {brand.discord_handle && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      {brand.discord_handle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                <Target size={24} className="text-brand-green" />
              </div>
              <p className="text-3xl font-black text-white">{missions.length}</p>
              <p className="text-sm text-gray-500 mt-1">Total Missions</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} className="text-brand-purple" />
              </div>
              <p className="text-3xl font-black text-white">{activeMissions.length}</p>
              <p className="text-sm text-gray-500 mt-1">Active Missions</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                <Award size={24} className="text-yellow-400" />
              </div>
              <p className="text-3xl font-black text-white">{completedMissions.length}</p>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="text-3xl font-black text-white">
                {new Date(brand.created_at).getFullYear()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Member Since</p>
            </div>
          </div>

          {/* Active Missions */}
          {activeMissions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp size={24} className="text-brand-green" />
                Active Missions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMissions.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="bg-brand-card border border-brand-border rounded-2xl p-6 hover:border-brand-green/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full text-xs font-medium">
                        {mission.status}
                      </span>
                      <span className="text-brand-green font-black">
                        {formatUSDC(mission.reward_pool)} {mission.currency}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-green transition-colors">
                      {mission.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {mission.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{timeUntil(mission.deadline)} left</span>
                      <span>Max {mission.max_winners} winners</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Missions */}
          {completedMissions.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Award size={24} className="text-yellow-400" />
                Past Missions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedMissions.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="bg-brand-card/50 border border-brand-border rounded-2xl p-6 hover:border-brand-green/30 transition-all group opacity-75 hover:opacity-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-full text-xs font-medium">
                        {mission.status}
                      </span>
                      <span className="text-brand-green font-black">
                        {formatUSDC(mission.reward_pool)} {mission.currency}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-green transition-colors">
                      {mission.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {mission.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Ended {new Date(mission.deadline).toLocaleDateString()}</span>
                      <span>Max {mission.max_winners} winners</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {missions.length === 0 && (
            <div className="text-center py-20 bg-brand-card/30 border border-dashed border-brand-border rounded-2xl">
              <Target size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No missions yet</p>
              <p className="text-gray-500 text-sm mt-2">This brand hasn&apos;t created any missions</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
