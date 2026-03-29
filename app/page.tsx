'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { WalletButton } from '@/components/wallet/wallet-button'
import { 
  Zap, Target, Trophy, Users, ArrowRight, 
  CheckCircle, TrendingUp, Shield, Star, ChevronRight 
} from 'lucide-react'

// Animated particle
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="particle" style={style} />
}

export default function Home() {
  const { publicKey } = useWallet()
  const [particles, setParticles] = useState<React.CSSProperties[]>([])
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const generated = Array.from({ length: 30 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 4 + 1}px`,
      height: `${Math.random() * 4 + 1}px`,
      background: i % 3 === 0 ? '#00FF88' : i % 3 === 1 ? '#9B59FF' : '#ffffff',
      opacity: Math.random() * 0.4 + 0.1,
      animationDuration: `${Math.random() * 15 + 10}s`,
      animationDelay: `${Math.random() * 10}s`,
      bottom: '-10px',
    }))
    setParticles(generated)
  }, [])

  const stats = [
    { label: 'Total Missions', value: '250+', icon: Target },
    { label: 'Creators Paid', value: '$50K+', icon: Trophy },
    { label: 'Community', value: '10K+', icon: Users },
    { label: 'Avg APY', value: '340%', icon: TrendingUp },
  ]

  const features = [
    {
      icon: Target,
      title: 'Create Missions',
      desc: 'Brands launch missions with SOL/USDC reward pools. Set requirements, deadlines, and watch creators compete.',
      color: 'brand-green',
    },
    {
      icon: Zap,
      title: 'Earn Rewards',
      desc: 'Creators submit content and get scored automatically. Top performers split 60% of the reward pool.',
      color: 'brand-purple',
    },
    {
      icon: Trophy,
      title: 'Climb Leaderboard',
      desc: 'Daily and weekly rankings. Build your reputation and unlock higher-tier missions with bigger payouts.',
      color: 'brand-green',
    },
    {
      icon: Shield,
      title: 'Solana-Powered',
      desc: 'Lightning-fast transactions on Solana mainnet. Connect with Phantom, Solflare, or any Solana wallet.',
      color: 'brand-purple',
    },
  ]

  const howItWorks = [
    { step: '01', title: 'Connect Wallet', desc: 'Connect your Solana wallet — Phantom, Solflare, or any supported wallet.' },
    { step: '02', title: 'Pick Your Role', desc: 'Join as a Creator to earn, or as a Brand to launch attention campaigns.' },
    { step: '03', title: 'Complete Missions', desc: 'Submit content, get engagement, and earn points automatically.' },
    { step: '04', title: 'Collect Rewards', desc: 'Winners receive SOL/USDC directly to their wallet when missions close.' },
  ]

  return (
    <div className="min-h-screen bg-brand-dark overflow-hidden">
      <Navbar />

      {/* HERO SECTION — Animated like GoDark */}
      <section className="relative min-h-screen flex items-center hero-bg grid-bg">
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => <Particle key={i} style={p} />)}
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-green/8 blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-purple/8 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-4xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="text-brand-green text-sm font-medium">LIVE ON SOLANA MAINNET</span>
            </div>

            {/* Hero headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6">
              <span className="text-white">The Attention</span>
              <br />
              <span className="text-brand-green text-glow-green">Marketplace</span>
              <br />
              <span className="text-brand-purple">For Web3</span>
            </h1>

            <p className="text-xl text-gray-400 mb-4 font-medium">GAMIFIED ENGAGEMENT PLATFORM</p>
            <p className="text-gray-500 text-lg mb-8 max-w-xl leading-relaxed">
              Brands fund missions · Creators compete · Winners earn SOL
              <br />Powered by on-chain scoring on Solana.
            </p>

            {/* Tag pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {['Instant Payouts', 'Auto-Scoring', 'Referral Rewards'].map(tag => (
                <span key={tag} className="text-sm text-gray-400 border border-brand-border rounded-full px-4 py-1.5">
                  {tag}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 items-center">
              {publicKey ? (
                <Link href="/creator"
                  className="flex items-center gap-2 bg-brand-green text-brand-dark font-black px-8 py-4 rounded-xl
                             hover:bg-opacity-90 transition-all hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] text-lg">
                  Enter Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <WalletButton />
              )}
              <Link href="/missions"
                className="flex items-center gap-2 border border-brand-border text-white px-8 py-4 rounded-xl
                           hover:border-brand-green/40 hover:bg-brand-green/5 transition-all text-lg">
                Browse Missions <ChevronRight size={18} />
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-10 mt-16 pt-10 border-t border-brand-border/50">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-3xl font-black text-white">{value}</span>
                  <span className="text-sm text-gray-500 mt-1">{label}</span>
                </div>
              ))}
              <div className="ml-auto hidden lg:flex items-center gap-2 text-gray-500 text-sm">
                <span>SECURED BY</span>
                <span className="text-brand-purple font-bold text-base">◎ SOLANA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Why <span className="gradient-text">EngageX</span>?
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            The complete gamified platform where attention becomes currency
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title}
              className="bg-brand-card border border-brand-border rounded-2xl p-8 card-hover shimmer group">
              <div className={`w-12 h-12 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className={`text-${color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 bg-brand-card/30 border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              How It <span className="text-brand-green">Works</span>
            </h2>
            <p className="text-gray-400 text-lg">From wallet connect to earning rewards in 4 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 h-full card-hover">
                  <div className="text-5xl font-black text-brand-green/20 mb-4 font-mono">{step}</div>
                  <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCORE FORMULA */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="bg-brand-card border border-brand-border rounded-3xl p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-brand-purple/5" />
          <div className="relative">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black mb-4">
                Transparent <span className="text-brand-green">Scoring</span>
              </h2>
              <p className="text-gray-400">Every score is calculated on-chain using this formula:</p>
            </div>

            <div className="bg-brand-dark/60 border border-brand-border rounded-2xl p-8 font-mono text-center max-w-2xl mx-auto">
              <p className="text-brand-green text-2xl md:text-3xl font-bold">
                Score = (Likes × 1) + (Comments × 3) + (Shares × 5) + (WatchTime × 2)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[['👍 Likes', '×1'], ['💬 Comments', '×3'], ['🔁 Shares', '×5'], ['⏱ Watch Time', '×2']].map(([label, weight]) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">{label}</p>
                    <p className="text-brand-green font-bold text-xl">{weight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {[['60%', 'Top Creators'], ['20%', 'Engagers'], ['20%', 'Platform Fee']].map(([pct, label]) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-black text-brand-green">{pct}</p>
                  <p className="text-gray-400 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to <span className="gradient-text">Earn?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Connect your Solana wallet and start earning from your content today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/missions"
              className="bg-brand-green text-brand-dark font-black px-10 py-4 rounded-xl text-lg
                         hover:bg-opacity-90 hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all flex items-center justify-center gap-2">
              Start Earning <ArrowRight size={20} />
            </Link>
            <Link href="/brand/missions/create"
              className="border border-brand-border text-white px-10 py-4 rounded-xl text-lg
                         hover:border-brand-purple/40 hover:bg-brand-purple/5 transition-all flex items-center justify-center gap-2">
              Launch a Mission <Target size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
