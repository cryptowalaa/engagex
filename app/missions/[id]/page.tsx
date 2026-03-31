'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { SubmissionForm } from '@/components/submissions/submission-form'
import { Clock, Users, Trophy, ExternalLink, Heart, MessageCircle, Share2, CheckCircle, TrendingUp, Link as LinkIcon } from 'lucide-react'
import { timeUntil, formatUSDC, shortenAddress } from '@/lib/utils/helpers'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'

// Points configuration
const ENGAGEMENT_POINTS = {
  like: 1,
  comment: 2,
  share: 3
}

// Score weights for creator points calculation
const SCORE_WEIGHTS = {
  likes: 1,
  comments: 3,
  shares: 5
}

// Auto-detect URLs in text and make them clickable
function LinkifyText({ text }: { text: string }) {
  if (!text) return null
  
  // Regex to detect URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g
  
  const parts = text.split(urlRegex)
  
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (!part) return null
        
        // Check if part is a URL
        if (part.match(/^https?:\/\//) || part.match(/^www\./)) {
          const url = part.startsWith('www.') ? `https://${part}` : part
          return (
            <a 
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green hover:underline break-all inline-flex items-center gap-1"
            >
              <LinkIcon size={12} />
              {part.length > 40 ? part.substring(0, 40) + '...' : part}
            </a>
          )
        }
        
        // Regular text - preserve newlines
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export default function MissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { publicKey } = useWallet()
  const [mission, setMission] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEngagements, setUserEngagements] = useState<Record<string, string[]>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [commentModal, setCommentModal] = useState<{ open: boolean; submissionId: string | null }>({ open: false, submissionId: null })
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id, publicKey])

  async function loadData() {
    setLoading(true)
    try {
      // Load mission with brand info including verified status
      const { data: m } = await (supabase.from('missions') as any)
        .select('*, brand:users(id, username, wallet_address, is_verified, is_official_verified, avatar_url)')
        .eq('id', id)
        .single()
      setMission(m)
      
      // Load submissions with engagement
      const { data: subs } = await (supabase
        .from('submissions') as any)
        .select(`*, creator:users(id, username, wallet_address, avatar_url), engagement:engagements(*)`)
        .eq('mission_id', id)
        .order('score', { ascending: false })
      
      setSubmissions(subs || [])
      
      // Load current user and their engagements
      if (publicKey) {
        const { data: u } = await (supabase.from('users') as any).select('*').eq('wallet_address', publicKey.toBase58()).single()
        if (u) {
          setCurrentUser(u)
          
          // Check if user submitted to this mission
          const { data: mine } = await (supabase.from('submissions') as any)
            .select('id')
            .eq('mission_id', id)
            .eq('creator_id', u.id)
            .single()
          setHasSubmitted(!!mine)
          
          // Load user's previous engagements for ALL submissions
          const { data: engagements } = await (supabase.from('user_engagements') as any)
            .select('submission_id, action_type')
            .eq('user_id', u.id)
          
          const engagementMap: Record<string, string[]> = {}
          engagements?.forEach((e: any) => {
            if (!engagementMap[e.submission_id]) engagementMap[e.submission_id] = []
            engagementMap[e.submission_id].push(e.action_type)
          })
          setUserEngagements(engagementMap)
        }
      }
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate creator score based on engagement
  function calculateCreatorScore(likes: number, comments: number, shares: number) {
    return (likes * SCORE_WEIGHTS.likes) + (comments * SCORE_WEIGHTS.comments) + (shares * SCORE_WEIGHTS.shares)
  }

  // Handle user engagement (like/comment/share)
  const handleEngagement = async (submissionId: string, actionType: 'like' | 'comment' | 'share', metadata?: any) => {
    if (!currentUser) {
      toast.error('Connect wallet first')
      return
    }
    
    // Check if already engaged
    if (userEngagements[submissionId]?.includes(actionType)) {
      toast.error(`You already ${actionType}d this!`)
      return
    }

    try {
      const points = ENGAGEMENT_POINTS[actionType]
      
      // Insert user engagement
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

      // Update engagement counts in engagements table
      const submission = submissions.find(s => s.id === submissionId)
      if (submission) {
        const currentEngagement = submission.engagement || { likes: 0, comments: 0, shares: 0 }
        const updates: any = {}
        
        if (actionType === 'like') updates.likes = (currentEngagement.likes || 0) + 1
        if (actionType === 'comment') updates.comments = (currentEngagement.comments || 0) + 1
        if (actionType === 'share') updates.shares = (currentEngagement.shares || 0) + 1
        
        // Calculate new score
        const newLikes = updates.likes ?? currentEngagement.likes
        const newComments = updates.comments ?? currentEngagement.comments
        const newShares = updates.shares ?? currentEngagement.shares
        const newScore = calculateCreatorScore(newLikes, newComments, newShares)
        
        // Update or insert engagement record
        if (submission.engagement?.id) {
          await (supabase.from('engagements') as any)
            .update({ ...updates, score: newScore, updated_at: new Date().toISOString() })
            .eq('id', submission.engagement.id)
        } else {
          await (supabase.from('engagements') as any)
            .insert({
              submission_id: submissionId,
              ...updates,
              score: newScore,
              recorded_at: new Date().toISOString()
            })
        }

        // Update submission score
        await (supabase.from('submissions') as any)
          .update({ score: newScore, updated_at: new Date().toISOString() })
          .eq('id', submissionId)
      }

      // Update local state immediately
      setUserEngagements(prev => ({
        ...prev,
        [submissionId]: [...(prev[submissionId] || []), actionType]
      }))

      // Refresh submissions to show updated scores
      await loadData()

      // Update user total_points
      await (supabase.from('users') as any)
        .update({ total_points: (currentUser.total_points || 0) + points })
        .eq('id', currentUser.id)

      toast.success(`+${points} points! You ${actionType}d the content!`)
    } catch (e: any) {
      console.error('Engagement error:', e)
      toast.error(e.message || 'Failed to record engagement')
    }
  }

  // Open comment modal
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

  // Submit comment
  const submitComment = async () => {
    if (!commentModal.submissionId || !commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }
    
    await handleEngagement(commentModal.submissionId, 'comment', { text: commentText })
    setCommentModal({ open: false, submissionId: null })
    setCommentText('')
  }

  // Handle share with Twitter
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
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!mission) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-white font-bold text-xl mb-2">Mission not found</h2>
        <Link href="/missions" className="text-brand-green">← Back to missions</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                {/* Mission Image */}
                {mission.image_url && (
                  <div className="mb-4 h-48 rounded-xl overflow-hidden bg-brand-dark relative">
                    <Image 
                      src={mission.image_url} 
                      alt={mission.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
                
                {/* Brand Info with Verified Badge - CLICKABLE */}
                <Link 
                  href={`/brand/${mission.brand?.id}`}
                  className="flex items-center gap-3 mb-4 p-3 -ml-3 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold group-hover:scale-110 transition-transform overflow-hidden">
                    {mission.brand?.avatar_url ? (
                      <Image 
                        src={mission.brand.avatar_url} 
                        alt={mission.brand?.username || 'Brand'} 
                        width={40} 
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      mission.brand?.username?.[0]?.toUpperCase() || 'B'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold group-hover:text-brand-green transition-colors">
                        {mission.brand?.username || shortenAddress(mission.brand?.wallet_address || '', 4)}
                      </p>
                      {/* Green Verified Badge */}
                      {mission.brand?.is_verified && !mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} className="fill-current" />
                          Verified
                        </span>
                      )}
                      {/* Yellow Official Badge */}
                      {mission.brand?.is_official_verified && (
                        <span className="flex items-center gap-1 text-xs bg-[#FFAD1F]/10 text-[#FFAD1F] border border-[#FFAD1F]/20 px-2 py-0.5 rounded-full">
                          <span className="w-3 h-3 bg-[#FFAD1F] rounded-full flex items-center justify-center text-[8px] text-brand-dark font-bold">✓</span>
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Brand · Click to view profile</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-500 group-hover:text-brand-green transition-colors" />
                </Link>
                
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full">{mission.status}</span>
                  <span className="text-xs text-gray-500">{mission.category}</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-4">{mission.title}</h1>
                
                {/* Description with proper formatting and clickable links */}
                <div className="text-gray-300 leading-relaxed mb-6 space-y-4">
                  <LinkifyText text={mission.description} />
                </div>
                
                {/* Requirements with proper formatting */}
                {mission.requirements && (
                  <div className="bg-brand-dark rounded-xl p-4 border border-brand-border">
                    <h3 className="text-white font-semibold mb-3 text-sm">Requirements</h3>
                    <div className="text-gray-400 text-sm space-y-2">
                      <LinkifyText text={mission.requirements} />
                    </div>
                  </div>
                )}
              </div>

              {/* Leaderboard Link */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
                <Link 
                  href={`/missions/${id}/leaderboard`}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                      <TrendingUp size={24} className="text-brand-purple" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold group-hover:text-brand-purple transition-colors">View Leaderboard</h3>
                      <p className="text-sm text-gray-400">See top creators rankings</p>
                    </div>
                  </div>
                  <div className="text-brand-purple">
                    <ExternalLink size={20} />
                  </div>
                </Link>
              </div>

              {submissions.length > 0 && (
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                  <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" /> Top Submissions
                  </h2>
                  <div className="space-y-4">
                    {submissions.slice(0, 10).map((sub, i) => {
                      const userActions = userEngagements[sub.id] || []
                      const hasLiked = userActions.includes('like')
                      const hasCommented = userActions.includes('comment')
                      const hasShared = userActions.includes('share')
                      
                      return (
                        <div key={sub.id} className="p-4 bg-brand-dark rounded-xl border border-brand-border">
                          {/* Creator Info */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i===0?'bg-yellow-500 text-black':i===1?'bg-gray-400 text-black':i===2?'bg-orange-500 text-black':'bg-brand-border text-gray-400'}`}>{i+1}</span>
                              <div>
                                <p className="text-white font-semibold">{sub.creator?.username || shortenAddress(sub.creator?.wallet_address || '', 4)}</p>
                                <span className="text-xs text-gray-500 capitalize">{sub.platform}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-brand-green font-bold text-lg">{Number(sub.score || 0).toFixed(0)}</span>
                              <span className="text-xs text-gray-500">pts</span>
                            </div>
                          </div>

                          {/* Engagement Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3 px-2">
                            <span className="flex items-center gap-1.5">
                              <Heart size={14} className="text-red-400"/> {sub.engagement?.likes || 0}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MessageCircle size={14} className="text-blue-400"/> {sub.engagement?.comments || 0}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Share2 size={14} className="text-green-400"/> {sub.engagement?.shares || 0}
                            </span>
                            <a href={sub.content_link} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-500 hover:text-brand-green transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          </div>

                          {/* User Engagement Buttons */}
                          {currentUser && currentUser.id !== sub.creator_id && (
                            <div className="flex gap-2 pt-3 border-t border-brand-border">
                              <button 
                                onClick={() => handleEngagement(sub.id, 'like')}
                                disabled={hasLiked}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                                  hasLiked 
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed' 
                                    : 'bg-brand-card border border-brand-border text-gray-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                }`}
                              >
                                <Heart size={16} className={hasLiked ? 'fill-current' : ''} />
                                {hasLiked ? 'Liked' : 'Like'} (+1)
                              </button>
                              
                              <button 
                                onClick={() => openCommentModal(sub.id)}
                                disabled={hasCommented}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                                  hasCommented 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-not-allowed' 
                                    : 'bg-brand-card border border-brand-border text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400'
                                }`}
                              >
                                <MessageCircle size={16} />
                                {hasCommented ? 'Commented' : 'Comment'} (+2)
                              </button>
                              
                              <button 
                                onClick={() => handleShare(sub)}
                                disabled={hasShared}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                                  hasShared 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed' 
                                    : 'bg-brand-card border border-brand-border text-gray-300 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'
                                }`}
                              >
                                <Share2 size={16} />
                                {hasShared ? 'Shared' : 'Share'} (+3)
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-brand-border">
                  <span className="text-gray-400 text-sm">Reward Pool</span>
                  <span className="text-brand-green font-bold">{mission.reward_pool} {mission.currency}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-brand-border">
                  <span className="text-gray-400 text-sm flex items-center gap-1"><Clock size={13} />Deadline</span>
                  <span className="text-yellow-400 text-sm font-medium">{timeUntil(mission.deadline)} left</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-brand-border">
                  <span className="text-gray-400 text-sm flex items-center gap-1"><Users size={13} />Max Winners</span>
                  <span className="text-white text-sm">{mission.max_winners}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400 text-sm">Submissions</span>
                  <span className="text-white text-sm">{submissions.length}</span>
                </div>
              </div>

              <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
                <h2 className="text-white font-bold mb-4">Submit Your Entry</h2>
                {hasSubmitted ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-brand-green font-semibold">Already Submitted!</p>
                    <p className="text-gray-400 text-sm mt-1">Your entry is under review</p>
                  </div>
                ) : (
                  <SubmissionForm missionId={id} onSuccess={() => setHasSubmitted(true)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add Comment (+2 points)</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCommentModal({ open: false, submissionId: null })}
                className="flex-1 py-3 bg-brand-dark border border-brand-border text-gray-300 rounded-xl font-semibold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="flex-1 py-3 bg-brand-green text-brand-dark rounded-xl font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50"
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
