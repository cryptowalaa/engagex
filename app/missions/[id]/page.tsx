'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { SubmissionForm } from '@/components/submissions/submission-form'
import { Clock, Users, Trophy, ExternalLink, Heart, MessageCircle, Share2, CheckCircle, TrendingUp, Link as LinkIcon, Medal, Loader2 } from 'lucide-react'
import { timeUntil, formatUSDC, shortenAddress } from '@/lib/utils/helpers'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'

function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return imageUrl
  const cleanPath = imageUrl.replace(/^(avatars|missions)\//, '')
  return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`
}

const ENGAGEMENT_POINTS = {
  like: 1,
  comment: 2,
  share: 3
}

const SCORE_WEIGHTS = {
  likes: 1,
  comments: 3,
  shares: 5
}

function LinkifyText({ text }: { text: string }) {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (!part) return null
        if (part.match(/^https?:\/\//) || part.match(/^www\./)) {
          const url = part.startsWith('www.') ? `https://${part}` : part
          return (
            <a 
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline break-all inline-flex items-center gap-1"
            >
              <LinkIcon size={12} />
              {part.length > 40 ? part.substring(0, 40) + '...' : part}
            </a>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

function isMissionExpired(deadline: string): boolean {
  return new Date(deadline) < new Date()
}

function getDisplayStatus(mission: any): { 
  status: string; 
  isExpired: boolean; 
  badgeClass: string 
} {
  const expired = isMissionExpired(mission.deadline)
  const status = expired ? 'expired' : mission.status
  
  let badgeClass = ''
  switch (status) {
    case 'active':
      badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      break
    case 'expired':
      badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20'
      break
    case 'funded':
      badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      break
    case 'completed':
      badgeClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      break
    default:
      badgeClass = 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
  }
  
  return { status, isExpired: expired, badgeClass }
}

// Top Creator Card Component
function TopCreatorCard({ entry, index }: { entry: any, index: number }) {
  const colors = [
    'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    'from-gray-400/20 to-gray-500/20 border-gray-400/30',
    'from-orange-500/20 to-orange-600/20 border-orange-500/30'
  ]
  
  const rankIcons = ['🥇', '🥈', '🥉']
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${colors[index]} border hover:scale-105 transition-transform cursor-pointer group`}>
      <div className="text-2xl">{rankIcons[index]}</div>
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10">
        {entry.creator?.avatar_url ? (
          <Image 
            src={getImageUrl(entry.creator.avatar_url)}
            alt={entry.creator?.username || 'Creator'}
            width={40}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <span className="text-sm font-bold text-white">
            {(entry.creator?.username || 'C')[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">
          {entry.creator?.username || shortenAddress(entry.creator?.wallet_address || '', 4)}
        </p>
        <p className="text-xs text-gray-400">{entry.score?.toFixed(0) || 0} pts</p>
      </div>
    </div>
  )
}

// Comment Type
interface Comment {
  id: string
  user_id: string
  submission_id: string
  text: string
  created_at: string
  user?: {
    username: string | null
    wallet_address: string
    avatar_url: string | null
  }
}

export default function MissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { publicKey } = useWallet()
  const [mission, setMission] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEngagements, setUserEngagements] = useState<Record<string, string[]>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [commentModal, setCommentModal] = useState<{ open: boolean; submissionId: string | null }>({ open: false, submissionId: null })
  const [commentText, setCommentText] = useState('')
  const [topCreators, setTopCreators] = useState<any[]>([])
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id, publicKey])

  // Load comments separately to avoid blocking main load
  useEffect(() => {
    if (submissions.length > 0) {
      loadComments(submissions.map((s: any) => s.id))
    }
  }, [submissions])

  async function loadData() {
    setLoading(true)
    try {
      // Load mission
      const { data: m, error: mError } = await (supabase.from('missions') as any)
        .select('*, brand:users(id, username, wallet_address, is_verified, is_official_verified, avatar_url, logo_url)')
        .eq('id', id)
        .single()
      
      if (mError) throw mError
      setMission(m)
      
      // Load submissions with engagement
      const { data: subs, error: sError } = await (supabase
        .from('submissions') as any)
        .select(`*, creator:users(id, username, wallet_address, avatar_url), engagement:engagements(*)`)
        .eq('mission_id', id)
        .order('score', { ascending: false })
      
      if (sError) throw sError
      
      const submissionsData = subs || []
      setSubmissions(submissionsData)
      
      // Set top 3 creators for sidebar
      setTopCreators(submissionsData.slice(0, 3))
      
      // Check user submission status
      if (publicKey) {
        const { data: u, error: uError } = await (supabase.from('users') as any)
          .select('*')
          .eq('wallet_address', publicKey.toBase58())
          .single()
          
        if (uError && uError.code !== 'PGRST116') {
          console.error('User load error:', uError)
        }
        
        if (u) {
          setCurrentUser(u)
          
          // FIXED: Properly check if user has submitted
          const { data: mine, error: mineError } = await (supabase.from('submissions') as any)
            .select('id, status')
            .eq('mission_id', id)
            .eq('creator_id', u.id)
          
          // Only set hasSubmitted if we actually got data back
          if (mine && mine.length > 0) {
            setHasSubmitted(true)
          } else {
            setHasSubmitted(false)
          }
          
          // Load user engagements
          const { data: engagements, error: eError } = await (supabase.from('user_engagements') as any)
            .select('submission_id, action_type')
            .eq('user_id', u.id)
          
          if (!eError && engagements) {
            const engagementMap: Record<string, string[]> = {}
            engagements.forEach((e: any) => {
              if (!engagementMap[e.submission_id]) engagementMap[e.submission_id] = []
              engagementMap[e.submission_id].push(e.action_type)
            })
            setUserEngagements(engagementMap)
          }
        } else {
          setCurrentUser(null)
          setHasSubmitted(false)
          setUserEngagements({})
        }
      } else {
        // No wallet connected
        setCurrentUser(null)
        setHasSubmitted(false)
        setUserEngagements({})
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Failed to load mission data')
    } finally {
      setLoading(false)
    }
  }

  async function loadComments(submissionIds: string[]) {
    if (!submissionIds.length) return
    
    try {
      const { data: commentsData, error } = await (supabase
        .from('comments') as any)
        .select(`
          *,
          user:users(username, wallet_address, avatar_url)
        `)
        .in('submission_id', submissionIds)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.log('Comments load error:', error)
        return
      }
      
      // Group comments by submission_id
      const grouped: Record<string, Comment[]> = {}
      commentsData?.forEach((comment: Comment) => {
        if (!grouped[comment.submission_id]) grouped[comment.submission_id] = []
        grouped[comment.submission_id].push(comment)
      })
      
      setComments(grouped)
    } catch (e) {
      console.log('Comments fetch error:', e)
    }
  }

  function calculateCreatorScore(likes: number, comments: number, shares: number) {
    return (likes * SCORE_WEIGHTS.likes) + (comments * SCORE_WEIGHTS.comments) + (shares * SCORE_WEIGHTS.shares)
  }

  // FIXED: Prevent page reload by using proper event handling
  const handleEngagement = useCallback(async (submissionId: string, actionType: 'like' | 'comment' | 'share', metadata?: any) => {
    if (!currentUser) {
      toast.error('Connect wallet first')
      return
    }
    
    if (userEngagements[submissionId]?.includes(actionType)) {
      toast.error(`You already ${actionType}d this!`)
      return
    }

    // Prevent double submission
    setSubmitting(prev => ({ ...prev, [submissionId + actionType]: true }))

    try {
      const points = ENGAGEMENT_POINTS[actionType]
      
      const { error: insertError } = await (supabase.from('user_engagements') as any)
        .insert({
          user_id: currentUser.id,
          submission_id: submissionId,
          action_type: actionType,
          points: points,
          metadata: metadata || null,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      // Update engagement counts locally first (optimistic update)
      const submission = submissions.find(s => s.id === submissionId)
      if (submission) {
        const currentEngagement = submission.engagement || { likes: 0, comments: 0, shares: 0, id: null }
        const updates: any = {}
        
        if (actionType === 'like') updates.likes = (currentEngagement.likes || 0) + 1
        if (actionType === 'comment') updates.comments = (currentEngagement.comments || 0) + 1
        if (actionType === 'share') updates.shares = (currentEngagement.shares || 0) + 1
        
        const newLikes = updates.likes ?? currentEngagement.likes
        const newComments = updates.comments ?? currentEngagement.comments
        const newShares = updates.shares ?? currentEngagement.shares
        const newScore = calculateCreatorScore(newLikes, newComments, newShares)
        
        // Update local state immediately
        setSubmissions(prev => prev.map(s => {
          if (s.id === submissionId) {
            return {
              ...s,
              engagement: {
                ...currentEngagement,
                ...updates,
                score: newScore
              },
              score: newScore
            }
          }
          return s
        }))

        // Update in background
        if (currentEngagement.id) {
          await (supabase.from('engagements') as any)
            .update({ ...updates, score: newScore, updated_at: new Date().toISOString() })
            .eq('id', currentEngagement.id)
        } else {
          const { data: newEng } = await (supabase.from('engagements') as any)
            .insert({
              submission_id: submissionId,
              ...updates,
              score: newScore,
              recorded_at: new Date().toISOString()
            })
            .select()
            .single()
          
          // Update local state with new engagement ID
          if (newEng) {
            setSubmissions(prev => prev.map(s => {
              if (s.id === submissionId) {
                return { ...s, engagement: { ...newEng } }
              }
              return s
            }))
          }
        }

        await (supabase.from('submissions') as any)
          .update({ score: newScore, updated_at: new Date().toISOString() })
          .eq('id', submissionId)
      }

      setUserEngagements(prev => ({
        ...prev,
        [submissionId]: [...(prev[submissionId] || []), actionType]
      }))

      // Update user points
      await (supabase.from('users') as any)
        .update({ total_points: (currentUser.total_points || 0) + points })
        .eq('id', currentUser.id)

      toast.success(`+${points} points!`)
    } catch (e: any) {
      console.error('Engagement error:', e)
      toast.error(e.message || 'Failed to record engagement')
      // Reload to sync state
      loadData()
    } finally {
      setSubmitting(prev => ({ ...prev, [submissionId + actionType]: false }))
    }
  }, [currentUser, submissions, userEngagements])

  const openCommentModal = (submissionId: string) => {
    if (!currentUser) {
      toast.error('Connect wallet first')
      return
    }
    if (userEngagements[submissionId]?.includes('comment')) {
      toast.error('You already commented on this!')
      return
    }
    setCommentModal({ open: true, submissionId })
  }

  const submitComment = async () => {
    if (!commentModal.submissionId || !commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }
    
    // Save comment to database
    try {
      const { error: commentError } = await (supabase.from('comments') as any).insert({
        submission_id: commentModal.submissionId,
        user_id: currentUser.id,
        text: commentText,
        created_at: new Date().toISOString()
      })
      
      if (commentError) throw commentError
      
      // Reload comments for this submission
      await loadComments([commentModal.submissionId])
    } catch (e: any) {
      console.error('Comment save error:', e)
      toast.error('Failed to save comment')
      return
    }
    
    await handleEngagement(commentModal.submissionId, 'comment', { text: commentText })
    setCommentModal({ open: false, submissionId: null })
    setCommentText('')
  }

  const handleShare = async (submission: any) => {
    if (!currentUser) {
      toast.error('Connect wallet first')
      return
    }
    if (userEngagements[submission.id]?.includes('share')) {
      toast.error('You already shared this!')
      return
    }

    const shareUrl = submission.content_link
    const tweetText = `Check out this content on EngageZ! 🚀\n\n${shareUrl}\n\n#EngageZ #Web3`

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')

    await handleEngagement(submission.id, 'share', { platform: 'twitter', url: shareUrl })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!mission) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-white font-bold text-xl mb-2">Mission not found</h2>
        <Link href="/missions" className="text-emerald-400">← Back to missions</Link>
      </div>
    </div>
  )

  const { status: displayStatus, isExpired, badgeClass } = getDisplayStatus(mission)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <Navbar />
      
      <main className="pt-24 pb-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Mission Card */}
              <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
                {mission.image_url && (
                  <div className="mb-4 h-48 rounded-xl overflow-hidden bg-gray-950 relative group">
                    <Image 
                      src={getImageUrl(mission.image_url)}
                      alt={mission.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                
                {/* Brand Header */}
                <Link 
                  href={`/brand/${mission.brand?.id}`}
                  className="flex items-center gap-3 mb-4 p-3 -ml-3 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform overflow-hidden border border-white/10">
                    {mission.brand?.logo_url || mission.brand?.avatar_url ? (
                      <Image 
                        src={getImageUrl(mission.brand.logo_url || mission.brand.avatar_url)}
                        alt={mission.brand?.username || 'Brand'} 
                        width={48} 
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      mission.brand?.username?.[0]?.toUpperCase() || 'B'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                        {mission.brand?.username || shortenAddress(mission.brand?.wallet_address || '', 4)}
                      </p>
                      {mission.brand?.is_verified && !mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} className="fill-current" />
                          Verified
                        </span>
                      )}
                      {mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-1 text-xs bg-[#FFAD1F]/10 text-[#FFAD1F] border border-[#FFAD1F]/20 px-2 py-0.5 rounded-full">
                          <span className="w-3 h-3 bg-[#FFAD1F] rounded-full flex items-center justify-center text-[8px] text-gray-950 font-bold">✓</span>
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Brand · Click to view profile</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
                </Link>
                
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${badgeClass}`}>
                    {displayStatus}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">{mission.category}</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 group-hover:text-emerald-400 transition-colors">
                  {mission.title}
                </h1>
                
                <div className="text-gray-300 leading-relaxed mb-6 space-y-4">
                  <LinkifyText text={mission.description} />
                </div>
                
                {mission.requirements && (
                  <div className="bg-gray-950/50 rounded-xl p-4 border border-gray-800">
                    <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-400" />
                      Requirements
                    </h3>
                    <div className="text-gray-400 text-sm space-y-2">
                      <LinkifyText text={mission.requirements} />
                    </div>
                  </div>
                )}
              </div>

              {/* Leaderboard Link */}
              <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-4 hover:border-emerald-500/30 transition-all group">
                <Link 
                  href={`/missions/${id}/leaderboard`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                      <TrendingUp size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold group-hover:text-purple-400 transition-colors">View Leaderboard</h3>
                      <p className="text-sm text-gray-400">See top creators rankings</p>
                    </div>
                  </div>
                  <div className="text-purple-400 group-hover:translate-x-1 transition-transform">
                    <ExternalLink size={20} />
                  </div>
                </Link>
              </div>

              {/* Submissions Section */}
              {submissions.length > 0 && (
                <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/20 transition-all">
                  <h2 className="text-white font-bold mb-6 flex items-center gap-2 text-xl">
                    <Trophy size={20} className="text-yellow-400" /> 
                    Top Submissions
                  </h2>
                  
                  <div className="space-y-6">
                    {submissions.slice(0, 10).map((sub, i) => {
                      const userActions = userEngagements[sub.id] || []
                      const hasLiked = userActions.includes('like')
                      const hasCommented = userActions.includes('comment')
                      const hasShared = userActions.includes('share')
                      const submissionComments = comments[sub.id] || []
                      
                      return (
                        <div key={sub.id} className="bg-gray-950/50 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                          {/* Submission Header */}
                          <div className="p-4 border-b border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  i===0 ? 'bg-yellow-500 text-black' : 
                                  i===1 ? 'bg-gray-400 text-black' : 
                                  i===2 ? 'bg-orange-500 text-black' : 
                                  'bg-gray-800 text-gray-400'
                                }`}>
                                  {i < 3 ? <Medal size={16} /> : i + 1}
                                </div>
                                <div>
                                  <p className="text-white font-semibold flex items-center gap-2">
                                    {sub.creator?.username || shortenAddress(sub.creator?.wallet_address || '', 4)}
                                    {sub.creator?.is_verified && (
                                      <CheckCircle size={14} className="text-emerald-400 fill-current" />
                                    )}
                                  </p>
                                  <span className="text-xs text-gray-500 capitalize">{sub.platform}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                <span className="text-emerald-400 font-bold text-lg">{Number(sub.score || 0).toFixed(0)}</span>
                                <span className="text-xs text-emerald-500/70">pts</span>
                              </div>
                            </div>

                            {/* Content Link */}
                            <a 
                              href={sub.content_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors bg-gray-900/50 p-3 rounded-lg border border-gray-800 hover:border-emerald-500/30"
                            >
                              <LinkIcon size={14} />
                              <span className="truncate flex-1">{sub.content_link}</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>

                          {/* Engagement Stats */}
                          <div className="px-4 py-3 bg-gray-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-6 text-sm">
                              <span className="flex items-center gap-2 text-gray-400">
                                <Heart size={16} className="text-red-400"/> 
                                <span className="font-medium">{sub.engagement?.likes || 0}</span>
                              </span>
                              <span className="flex items-center gap-2 text-gray-400">
                                <MessageCircle size={16} className="text-blue-400"/> 
                                <span className="font-medium">{sub.engagement?.comments || 0}</span>
                              </span>
                              <span className="flex items-center gap-2 text-gray-400">
                                <Share2 size={16} className="text-green-400"/> 
                                <span className="font-medium">{sub.engagement?.shares || 0}</span>
                              </span>
                            </div>
                            
                            {currentUser && currentUser.id !== sub.creator_id && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleEngagement(sub.id, 'like')
                                  }}
                                  disabled={hasLiked || submitting[sub.id + 'like']}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                                    hasLiked 
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                      : 'bg-gray-800 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30'
                                  }`}
                                >
                                  {submitting[sub.id + 'like'] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Heart size={14} className={hasLiked ? 'fill-current' : ''} />
                                  )}
                                  {hasLiked ? 'Liked' : 'Like'} (+1)
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openCommentModal(sub.id)
                                  }}
                                  disabled={hasCommented || submitting[sub.id + 'comment']}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                                    hasCommented 
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                      : 'bg-gray-800 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/30'
                                  }`}
                                >
                                  {submitting[sub.id + 'comment'] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <MessageCircle size={14} />
                                  )}
                                  {hasCommented ? 'Commented' : 'Comment'} (+2)
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleShare(sub)
                                  }}
                                  disabled={hasShared || submitting[sub.id + 'share']}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                                    hasShared 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                      : 'bg-gray-800 text-gray-400 hover:bg-green-500/10 hover:text-green-400 border border-transparent hover:border-green-500/30'
                                  }`}
                                >
                                  {submitting[sub.id + 'share'] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Share2 size={14} />
                                  )}
                                  {hasShared ? 'Shared' : 'Share'} (+3)
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Comments Section */}
                          {submissionComments.length > 0 && (
                            <div className="px-4 py-3 bg-gray-950/30 border-t border-gray-800">
                              <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Comments</h4>
                              <div className="space-y-3">
                                {submissionComments.slice(0, 3).map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 overflow-hidden">
                                      {comment.user?.avatar_url ? (
                                        <Image 
                                          src={getImageUrl(comment.user.avatar_url)}
                                          alt={comment.user?.username || 'User'}
                                          width={32}
                                          height={32}
                                          className="object-cover w-full h-full"
                                          unoptimized
                                        />
                                      ) : (
                                        (comment.user?.username || 'U')[0].toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1 bg-gray-900/50 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white">
                                          {comment.user?.username || shortenAddress(comment.user?.wallet_address || '', 4)}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-300">{comment.text}</p>
                                    </div>
                                  </div>
                                ))}
                                {submissionComments.length > 3 && (
                                  <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                                    View {submissionComments.length - 3} more comments
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Mission Stats */}
              <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/20 transition-all">
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400 text-sm">Reward Pool</span>
                  <span className="text-emerald-400 font-bold text-lg">{mission.reward_pool} {mission.currency}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    Deadline
                  </span>
                  <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                    {isExpired ? 'Expired' : `${timeUntil(mission.deadline)} left`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Users size={14} className="text-emerald-400" />
                    Max Winners
                  </span>
                  <span className="text-white text-sm font-medium">{mission.max_winners}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400 text-sm">Submissions</span>
                  <span className="text-white text-sm font-medium">{submissions.length}</span>
                </div>
              </div>

              {/* Submit Entry - FIXED */}
              <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/20 transition-all">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-400" />
                  Submit Your Entry
                </h2>
                
                {isExpired ? (
                  <div className="text-center py-6 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div className="text-4xl mb-2">⏰</div>
                    <p className="text-red-400 font-semibold">Mission Expired</p>
                    <p className="text-gray-400 text-sm mt-1">Submissions are closed</p>
                  </div>
                ) : hasSubmitted ? (
                  <div className="text-center py-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                      <CheckCircle size={32} className="text-gray-950" />
                    </div>
                    <p className="text-emerald-400 font-bold text-lg">Already Submitted!</p>
                    <p className="text-gray-400 text-sm mt-1">Your entry is under review</p>
                  </div>
                ) : (
                  <SubmissionForm missionId={id} onSuccess={() => {
                    setHasSubmitted(true)
                    loadData()
                  }} />
                )}
              </div>

              {/* Top 3 Creators */}
              {topCreators.length > 0 && (
                <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Trophy size={18} className="text-yellow-400" />
                      Top Creators
                    </h3>
                    <Link 
                      href={`/missions/${id}/leaderboard`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  
                  <div className="space-y-3">
                    {topCreators.map((creator, index) => (
                      <TopCreatorCard key={creator.id} entry={creator} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {/* Share Mission */}
              <div className="bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/20 transition-all">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Share Mission</h3>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-all flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">
                    <LinkIcon size={18} />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Comment Modal */}
      {commentModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-400" />
              Add Comment
            </h3>
            <p className="text-sm text-gray-400 mb-4">+2 points for commenting</p>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCommentModal({ open: false, submissionId: null })}
                className="flex-1 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="flex-1 py-3 bg-emerald-500 text-gray-950 rounded-xl font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Comment
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
