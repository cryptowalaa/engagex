'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string | null
  initialIsFollowing?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  followerCount?: number
  onFollowChange?: (isFollowing: boolean, newCount: number) => void
}

export function FollowButton({ 
  targetUserId, 
  currentUserId, 
  initialIsFollowing = false,
  size = 'md',
  showCount = false,
  followerCount = 0,
  onFollowChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(followerCount)

  useEffect(() => {
    if (!currentUserId || currentUserId === targetUserId) return
    checkFollowStatus()
  }, [currentUserId, targetUserId])

  async function checkFollowStatus() {
    try {
      const { data } = await (supabase.from('follows') as any)
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()
      
      setIsFollowing(!!data)
    } catch (e) {
      console.error('Check follow error:', e)
    }
  }

  async function handleFollow() {
    if (!currentUserId) {
      toast.error('Please connect wallet first')
      return
    }
    
    if (currentUserId === targetUserId) {
      toast.error('You cannot follow yourself')
      return
    }

    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await (supabase.from('follows') as any)
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        
        if (error) throw error
        
        const newCount = Math.max(0, count - 1)
        setIsFollowing(false)
        setCount(newCount)
        onFollowChange?.(false, newCount)
        toast.success('Unfollowed')
      } else {
        // Follow
        const { error } = await (supabase.from('follows') as any)
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
            created_at: new Date().toISOString()
          })
        
        if (error) throw error
        
        const newCount = count + 1
        setIsFollowing(true)
        setCount(newCount)
        onFollowChange?.(true, newCount)
        toast.success('Following now!')
      }
    } catch (e: any) {
      console.error('Follow error:', e)
      toast.error(e.message || 'Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`
        flex items-center gap-2 font-semibold rounded-xl transition-all duration-200
        ${sizeClasses[size]}
        ${isFollowing 
          ? 'bg-brand-green/10 text-brand-green border border-brand-green/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' 
          : 'bg-brand-green text-brand-dark hover:bg-opacity-90'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
          <span>Follow</span>
        </>
      )}
      
      {showCount && (
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
          isFollowing ? 'bg-brand-green/20' : 'bg-brand-dark/20'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}
