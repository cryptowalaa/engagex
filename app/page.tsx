'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { WalletButton } from '@/components/wallet/wallet-button'
import { 
  Zap, Target, Trophy, Users, ArrowRight, 
  CheckCircle, TrendingUp, Shield, Star, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { shortenAddress } from '@/lib/utils/helpers'
import { CreatorProfileModal } from '@/components/creator-profile-modal'

function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="particle" style={style} />
}

interface TopCreator {
  id: string
  wallet_address: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  twitter_handle: string | null
  discord_handle: string | null
  total_earned: number
  total_points: number
}

interface FeaturedBrand {
  id: string
  brand_id: string
  display_order: number
  brand: {
    id: string
    username: string | null
    logo_url: string | null
    wallet_address: string
    is_verified: boolean
    is_official_verified: boolean
  }
}

export default function Home() {
  const { publicKey } = useWallet()
  const [particles, setParticles] = useState<React.CSSProperties[]>([])
  const [topCreators, setTopCreators] = useState<TopCreator[]>([])
  const [featuredBrands, setFeaturedBrands] = useState<FeaturedBrand[]>([])
  const [selectedCreator, setSelectedCreator] = useState<TopCreator | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      background: i % 3 === 0 ? '#00FF88' : i % 3 === 1 ? '#9B59FF' : '#ffffff',
      opacity: Math.random() * 0.4 + 0.1,
      animationDuration: `${Math.random() * 15 + 10}s`,
      animationDelay: `${Math.random() * 10}s`,
      bottom: '-10px',
    }))
    setParticles(generated)
    
    loadTopCreators()
    loadFeaturedBrands()
  }, [])

  async function loadTopCreators() {
    try {
      const { data } = await (supabase.from('users') as any)
        .select('id, wallet_address, username, avatar_url, bio, twitter_handle, discord_handle, total_earned, total_points')
        .order('total_earned', { ascending: false })
        .limit(10)
      
      setTopCreators(data || [])
    } catch (error) {
      console.error('Load creators error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadFeaturedBrands() {
    try {
      const { data } = await (supabase.from('featured_brands') as any)
        .select(`
          id,
          brand_id,
          display_order,
          brand:users(id, username, logo_url, wallet_address, is_verified, is_official_verified)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(10)
      
      setFeaturedBrands(data || [])
    } catch (error) {
      console.error('Load featured brands error:', error)
    }
  }

  const AvatarImage = ({ url, name, size = 80 }: { url: string | null, name: string | null, size?: number }) => {
    const [error, setError] = useState(false)
    
    if (!url || error) {
      return (
        <span className="text-xl md:text-2xl font-black text-brand-dark flex items-center justify-center w-full h-full">
          {name?.[0]?.toUpperCase() || 'C'}
        </span>
      )
    }
    
    return (
      <img 
        src={url} 
        alt={name || 'User'} 
        className="object-cover w-full h-full"
        onError={() => setError(true)}
      />
    )
  }

 const stats = [
  { label: 'Total Missions', value: 'Beta', icon: Target },      // 250+ ki jagah Beta
  { label: 'Creators Paid', value: 'Coming Soon', icon: Trophy }, // $50K+ ki jagah Coming Soon
  { label: 'Community', value: 'Beta', icon: Users },             // 10K+ ki jagah Beta
  // Avg APY 340% removed
  ]

  const features = [
    { icon: Target, title: 'Create Missions', desc: 'Brands launch missions with SOL/USDC reward pools. Set requirements, deadlines, and watch creators compete.', color: 'brand-green' },
    { icon: Zap, title: 'Earn Rewards', desc: 'Creators submit content and get scored automatically. Top performers split 60% of the reward pool.', color: 'brand-purple' },
    { icon: Trophy, title: 'Climb Leaderboard', desc: 'Daily and weekly rankings. Build your reputation and unlock higher-tier missions with bigger payouts.', color: 'brand-green' },
    { icon: Shield, title: 'Solana-Powered', desc: 'Lightning-fast transactions on Solana mainnet. Connect with Phantom, Solflare, or any Solana wallet.', color: 'brand-purple' },
  ]

  const howItWorks = [
    { step: '01', title: 'Connect Wallet', desc: 'Connect your Solana wallet — Phantom, Solflare, or any supported wallet.' },
    { step: '02', title: 'Pick Your Role', desc: 'Join as a Creator to earn, or as a Brand to launch attention campaigns.' },
    { step: '03', title: 'Complete Missions', desc: 'Submit content, get engagement, and earn points automatically.' },
    { step: '04', title: 'Collect Rewards', desc: 'Winners receive SOL/USDC directly to their wallet when missions close.' },
  ]

  return (
    <div className="min-h-screen bg-brand-dark overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION - Mobile Optimized */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center hero-bg grid-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => <Particle key={i} style={p} />)}
        </div>
        {/* Mobile-safe glow effects */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 rounded-full bg-brand-green/8 blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 md:w-80 md:h-80 rounded-full bg-brand-purple/8 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-16 md:pb-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/20 rounded-full px-3 py-1.5 mb-6 md:mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="text-brand-green text-xs md:text-sm font-medium">LIVE ON SOLANA MAINNET</span>
            </div>

            {/* Mobile-responsive typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-tight md:leading-none mb-4 md:mb-6">
              <span className="text-white">The Attention</span>
              <br />
              <span className="text-brand-green text-glow-green">Marketplace</span>
              <br />
              <span className="text-brand-purple">For Web3</span>
            </h1>

            <p className="text-base md:text-xl text-gray-400 mb-2 md:mb-4 font-medium">GAMIFIED ENGAGEMENT PLATFORM</p>
            <p className="text-gray-500 text-sm md:text-lg mb-6 md:mb-8 max-w-xl leading-relaxed">
              Brands fund missions · Creators compete · Winners earn SOL
              <br className="hidden md:block" />Powered by on-chain scoring on Solana.
            </p>

            <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-10">
              {['Instant Payouts', 'Auto-Scoring', 'Referral Rewards'].map(tag => (
                <span key={tag} className="text-xs md:text-sm text-gray-400 border border-brand-border rounded-full px-3 py-1 md:px-4 md:py-1.5">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center">
              {publicKey ? (
                <Link href="/creator"
                  className="flex items-center justify-center gap-2 bg-brand-green text-brand-dark font-black px-6 py-3 md:px-8 md:py-4 rounded-xl hover:bg-opacity-90 transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] text-base md:text-lg">
                  Enter Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <div className="flex justify-center sm:justify-start">
                  <WalletButton />
                </div>
              )}
              <Link href="/missions"
                className="flex items-center justify-center gap-2 border border-brand-border text-white px-6 py-3 md:px-8 md:py-4 rounded-xl hover:border-brand-green/40 hover:bg-brand-green/5 transition-all text-base md:text-lg">
                Browse Missions <ChevronRight size={16} />
              </Link>
            </div>

            {/* Stats - Stack on mobile */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 md:gap-10 mt-10 md:mt-16 pt-8 md:pt-10 border-t border-brand-border/50">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center md:items-start">
                  <span className="text-2xl md:text-3xl font-black text-white">{value}</span>
                  <span className="text-xs md:text-sm text-gray-500 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TOP CREATORS - Mobile Optimized */}
      <section className="py-12 md:py-20 px-4 bg-brand-card/20 border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2">
                Top <span className="text-brand-green">Creators</span> of the Week
              </h2>
              <p className="text-gray-400 text-sm md:text-base">Highest earners this week · Click to view profile</p>
            </div>
            <Link href="/leaderboard" className="flex items-center gap-2 text-brand-green hover:underline text-sm md:text-base">
              View Full Leaderboard <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-40 md:w-64 h-64 md:h-80 bg-brand-card rounded-2xl animate-pulse border border-brand-border flex-shrink-0" />
              ))}
            </div>
          ) : topCreators.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy size={40} className="mx-auto mb-4 text-gray-700" />
              <p className="text-sm md:text-base">No creators yet. Be the first!</p>
            </div>
          ) : (
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {topCreators.map((creator, index) => (
                <div 
                  key={creator.id}
                  onClick={() => setSelectedCreator(creator)}
                  className="w-40 sm:w-48 md:w-64 bg-brand-card border border-brand-border rounded-2xl p-4 md:p-6 flex-shrink-0 snap-start hover:border-brand-green/30 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)] transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className={`absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-black
                    ${index === 0 ? 'bg-yellow-400 text-black' : 
                      index === 1 ? 'bg-gray-400 text-black' : 
                      index === 2 ? 'bg-orange-400 text-black' : 
                      'bg-brand-border text-gray-400'}`}>
                    #{index + 1}
                  </div>

                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-brand-green to-brand-purple flex items-center justify-center mx-auto mb-3 md:mb-4 overflow-hidden">
                    <AvatarImage url={creator.avatar_url} name={creator.username} size={80} />
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-white mb-1 text-sm md:text-base truncate">
                      {creator.username || 'Anonymous'}
                    </h3>
                    <p className="text-brand-green font-mono text-xs mb-2 md:mb-3">
                      {shortenAddress(creator.wallet_address, 4)}
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm">
                      <div className="text-center">
                        <p className="text-brand-green font-black text-base md:text-lg">
                          {creator.total_earned || 0}
                        </p>
                        <p className="text-gray-500 text-xs">Earned</p>
                      </div>
                      <div className="w-px h-6 md:h-8 bg-brand-border" />
                      <div className="text-center">
                        <p className="text-brand-purple font-black text-base md:text-lg">
                          {creator.total_points || 0}
                        </p>
                        <p className="text-gray-500 text-xs">Points</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED BRANDS - Mobile Optimized */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2">
                Featured <span className="text-brand-purple">Brands</span>
              </h2>
              <p className="text-gray-400 text-sm md:text-base">Sponsored & Official partners · Click to explore missions</p>
            </div>
            <Link href="/missions" className="flex items-center gap-2 text-brand-purple hover:underline text-sm md:text-base">
              View All Missions <ArrowRight size={16} />
            </Link>
          </div>

          {featuredBrands.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star size={40} className="mx-auto mb-4 text-gray-700" />
              <p className="text-sm md:text-base">No featured brands yet.</p>
              <p className="text-xs md:text-sm mt-2">Admin will add sponsored brands here.</p>
            </div>
          ) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide items-center">
              {featuredBrands.map((featured) => (
                <Link 
                  key={featured.id}
                  href={`/brand/${featured.brand_id}`}
                  className="w-36 sm:w-40 md:w-48 bg-brand-card border border-brand-border rounded-2xl p-4 md:p-6 flex-shrink-0 snap-start hover:border-brand-purple/30 hover:shadow-[0_0_20px_rgba(155,89,255,0.1)] transition-all group text-center"
                >
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-green flex items-center justify-center mx-auto mb-3 md:mb-4 overflow-hidden">
                    {featured.brand?.logo_url ? (
                      <img 
                        src={featured.brand.logo_url} 
                        alt={featured.brand.username || 'Brand'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-xl md:text-3xl font-black text-white">
                        {featured.brand?.username?.[0]?.toUpperCase() || 'B'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white mb-2 text-sm md:text-base truncate">
                    {featured.brand?.username || 'Anonymous'}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-1 mb-2 md:mb-3 flex-wrap">
                    {featured.brand?.is_official_verified && (
                      <span className="flex items-center gap-1 text-xs bg-[#FFAD1F]/10 text-[#FFAD1F] border border-[#FFAD1F]/20 px-2 py-0.5 rounded-full">
                        <Star size={10} className="fill-current" /> Official
                      </span>
                    )}
                    {featured.brand?.is_verified && !featured.brand?.is_official_verified && (
                      <span className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} className="fill-current" /> Verified
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES - Mobile Optimized */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4">
            Why <span className="gradient-text">EngageZ</span>?
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
            The complete gamified platform where attention becomes currency
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 card-hover shimmer group">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={20} className={`text-${color} md:w-6 md:h-6`} />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">{title}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - Mobile Optimized */}
      <section className="py-16 md:py-24 px-4 bg-brand-card/30 border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4">
              How It <span className="text-brand-green">Works</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg">From wallet connect to earning rewards in 4 steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-brand-card border border-brand-border rounded-2xl p-5 md:p-6 h-full card-hover">
                  <div className="text-3xl md:text-5xl font-black text-brand-green/20 mb-3 md:mb-4 font-mono">{step}</div>
                  <h3 className="text-base md:text-lg font-bold mb-2 text-white">{title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCORE FORMULA - Mobile Optimized */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
        <div className="bg-brand-card border border-brand-border rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-brand-purple/5" />
          <div className="relative">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 md:mb-4">
                Transparent <span className="text-brand-green">Scoring</span>
              </h2>
              <p className="text-gray-400 text-sm md:text-base">Every score is calculated on-chain using this formula:</p>
            </div>

            <div className="bg-brand-dark/60 border border-brand-border rounded-xl md:rounded-2xl p-4 md:p-8 font-mono text-center max-w-2xl mx-auto">
              <p className="text-brand-green text-base md:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight">
                Score = (Likes × 1) + (Comments × 3) + (Shares × 5) + (WatchTime × 2)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4 md:mt-8">
                {[['👍 Likes', '×1'], ['💬 Comments', '×3'], ['🔁 Shares', '×5'], ['⏱ Watch Time', '×2']].map(([label, weight]) => (
                  <div key={label} className="bg-white/5 rounded-lg md:rounded-xl p-2 md:p-3">
                    <p className="text-gray-400 text-xs mb-1">{label}</p>
                    <p className="text-brand-green font-bold text-lg md:text-xl">{weight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 md:mt-10">
              {[['60%', 'Top Creators'], ['20%', 'Engagers'], ['20%', 'Platform Fee']].map(([pct, label]) => (
                <div key={label} className="text-center">
                  <p className="text-2xl md:text-3xl font-black text-brand-green">{pct}</p>
                  <p className="text-gray-400 text-xs md:text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER - Mobile Optimized */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6">
            Ready to <span className="gradient-text">Earn?</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg mb-6 md:mb-10">
            Connect your Solana wallet and start earning from your content today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/missions"
              className="bg-brand-green text-brand-dark font-black px-8 py-3 md:px-10 md:py-4 rounded-xl text-base md:text-lg hover:bg-opacity-90 hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all flex items-center justify-center gap-2">
              Start Earning <ArrowRight size={18} />
            </Link>
            <Link href="/brand/missions/create"
              className="border border-brand-border text-white px-8 py-3 md:px-10 md:py-4 rounded-xl text-base md:text-lg hover:border-brand-purple/40 hover:bg-brand-purple/5 transition-all flex items-center justify-center gap-2">
              Launch a Mission <Target size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <CreatorProfileModal 
        creator={selectedCreator} 
        isOpen={!!selectedCreator} 
        onClose={() => setSelectedCreator(null)} 
      />
    </div>
  )
}
