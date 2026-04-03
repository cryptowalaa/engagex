'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { 
  Trophy, ArrowLeft, Heart, MessageCircle, Share2, 
  Target, Award, Star, Twitter, Globe, Wallet,
  ExternalLink, Calendar, TrendingUp
} from 'lucide-react'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'
import Image from 'next/image'
import Link from 'next/link'

// Inline getImageUrl function
function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return imageUrl
  const cleanPath = imageUrl.replace(/^(avatars|missions)\//, '')
  return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`
}

interface CreatorProfile {
  id: string
  wallet_address: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  twitter_handle: string | null
  discord_handle: string | null
  telegram_handle: string | null
  website_url: string | null
  total_earned: number
  total_points: number
  created_at: string
}

interface Submission {
  id: string
  mission_id: string
  mission_title: string
  mission_brand: string
  content_link: string
  platform: string
  score: number
  status: string
  likes: number
  comments: number
  shares: number
  submitted_at: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned_at: string
}

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string
  
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMissions: 0,
    winRate: 0,
    avgScore: 0,
    totalEngagement: 0
  })

  useEffect(() => {
    if (!creatorId) return
    loadCreatorProfile()
  }, [creatorId])

  async function loadCreatorProfile() {
    setLoading(true)
    try {
      // Load creator info
      const { data: creatorData } = await (supabase.from('users') as any)
        .select('id, wallet_address, username, avatar_url, bio, twitter_handle, discord_handle, telegram_handle, website_url, total_earned, total_points, created_at')
        .eq('id', creatorId)
        .single()
      
      if (!creatorData) {
        setLoading(false)
        return
      }
      
      setCreator(creatorData)

      // Load submissions with mission details
      const { data: subsData } = await (supabase.from('submissions') as any)
        .select(`
          id,
          mission_id,
          content_link,
          platform,
          score,
          status,
          submitted_at,
          mission:missions(title, brand:users(username)),
          engagement:engagements(likes, comments, shares)
        `)
        .eq('creator_id', creatorId)
        .order('submitted_at', { ascending: false })

      const formattedSubs = (subsData || []).map((sub: any) => ({
        id: sub.id,
        mission_id: sub.mission_id,
        mission_title: sub.mission?.title || 'Unknown Mission',
        mission_brand: sub.mission?.brand?.username || 'Unknown Brand',
        content_link: sub.content_link,
        platform: sub.platform,
        score: sub.score || 0,
        status: sub.status,
        likes: sub.engagement?.likes || 0,
        comments: sub.engagement?.comments || 0,
        shares: sub.engagement?.shares || 0,
        submitted_at: sub.submitted_at
      }))
      
      setSubmissions(formattedSubs)

      // Calculate stats
      const totalMissions = new Set(formattedSubs.map((s: Submission) => s.mission_id)).size
      const wins = formattedSubs.filter((s: Submission) => s.status === 'winner').length
      const winRate = formattedSubs.length > 0 ? Math.round((wins / formattedSubs.length) * 100) : 0
      const avgScore = formattedSubs.length > 0 
        ? Math.round(formattedSubs.reduce((sum: number, s: Submission) => sum + s.score, 0) / formattedSubs.length)
        : 0
      const totalEngagement = formattedSubs.reduce((sum: number, s: Submission) => sum + s.likes + s.comments + s.shares, 0)
      
      setStats({
        totalMissions,
        winRate,
        avgScore,
        totalEngagement
      })

      // Load achievements (mock data - you can create a real achievements table)
      setAchievements([
        { id: '1', title: 'First Submission', description: 'Submitted first content', icon: '🎯', earned_at: creatorData.created_at },
        { id: '2', title: 'Rising Star', description: 'Earned 1000+ points', icon: '⭐', earned_at: creatorData.created_at },
        { id: '3', title: 'Winner', description: 'Won a mission', icon: '🏆', earned_at: creatorData.created_at },
      ])

    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏'
      case 'tiktok': return '🎵'
      case 'youtube': return '▶️'
      case 'instagram': return '📸'
      default: return '🌐'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winner': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'approved': return 'text-brand-green bg-brand-green/10 border-brand-green/20'
      case 'pending': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-white font-bold text-xl mb-2">Creator not found</h2>
          <Link href="/leaderboard" className="text-brand-green hover:underline">← Back to Leaderboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/leaderboard" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back to Leaderboard
          </Link>

          {/* Profile Header */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar - FIXED with getImageUrl */}
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-brand-green to-brand-purple flex items-center justify-center text-brand-dark font-black text-5xl overflow-hidden flex-shrink-0">
                {creator.avatar_url ? (
                  <Image 
                    src={getImageUrl(creator.avatar_url)} 
                    alt={creator.username || 'Creator'} 
                    width={112} 
                    height={112}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                    unoptimized
                  />
                ) : (
                  creator.username?.[0]?.toUpperCase() || 'C'
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-3xl font-black text-white">
                    {creator.username || 'Anonymous Creator'}
                  </h1>
                  <span className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 rounded-full">
                    <Trophy size={12} className="fill-current" />
                    Creator
                  </span>
                </div>
                
                <p className="text-brand-green font-mono text-sm mb-3">
                  {shortenAddress(creator.wallet_address, 8)}
                </p>

                {creator.bio && (
                  <p className="text-gray-400 max-w-2xl mb-4">{creator.bio}</p>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap gap-3">
                  {creator.website_url && (
                    <a 
                      href={creator.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300 hover:text-brand-green hover:border-brand-green/30 transition-all"
                    >
                      <Globe size={16} />
                      Website
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {creator.twitter_handle && (
                    <a 
                      href={`https://x.com/${creator.twitter_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300 hover:text-brand-green hover:border-brand-green/30 transition-all"
                    >
                      <Twitter size={16} />
                      @{creator.twitter_handle.replace('@', '')}
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {creator.discord_handle && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300">
                      <MessageCircle size={16} />
                      {creator.discord_handle}
                    </div>
                  )}
                  {creator.telegram_handle && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      {creator.telegram_handle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                <Wallet size={24} className="text-brand-green" />
              </div>
              <p className="text-3xl font-black text-white">{formatUSDC(creator.total_earned)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Earned</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-brand-purple" />
              </div>
              <p className="text-3xl font-black text-white">{creator.total_points.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total Points</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                <Target size={24} className="text-yellow-400" />
              </div>
              <p className="text-3xl font-black text-white">{stats.totalMissions}</p>
              <p className="text-sm text-gray-500 mt-1">Missions Joined</p>
            </div>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} className="text-blue-400" />
              </div>
              <p className="text-3xl font-black text-white">{stats.winRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Win Rate</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
              <Award size={24} className="text-brand-green" />
              Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="bg-brand-card border border-brand-border rounded-2xl p-6 text-center hover:border-brand-green/30 transition-all">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="font-bold text-white text-sm mb-1">{achievement.title}</h3>
                  <p className="text-gray-500 text-xs">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions History */}
          <div>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
              <Target size={24} className="text-brand-purple" />
              Submission History
              <span className="ml-2 text-xs bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full">
                {submissions.length} total
              </span>
            </h2>
            
            {submissions.length === 0 ? (
              <div className="text-center py-16 bg-brand-card/30 border border-dashed border-brand-border rounded-2xl">
                <Target size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No submissions yet</p>
                <p className="text-gray-500 text-sm mt-2">This creator hasn&apos;t submitted any content</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub) => (
                  <div 
                    key={sub.id}
                    className="bg-brand-card border border-brand-border rounded-2xl p-6 hover:border-brand-green/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getPlatformIcon(sub.platform)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      <span className="text-brand-green font-black text-lg">
                        {sub.score.toFixed(0)} pts
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-white mb-1">{sub.mission_title}</h3>
                    <p className="text-gray-500 text-sm mb-4">by {sub.mission_brand}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Heart size={14} className="text-red-400" />
                        {sub.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} className="text-blue-400" />
                        {sub.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={14} className="text-green-400" />
                        {sub.shares}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                      <span className="text-xs text-gray-500">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                      <a 
                        href={sub.content_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-green hover:underline flex items-center gap-1"
                      >
                        View Content <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
