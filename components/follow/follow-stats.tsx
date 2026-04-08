'use client'

import { Users } from 'lucide-react'

interface FollowStatsProps {
  followersCount: number
  followingCount: number
  onFollowersClick?: () => void
  onFollowingClick?: () => void
  compact?: boolean
}

export function FollowStats({ 
  followersCount, 
  followingCount,
  onFollowersClick,
  onFollowingClick,
  compact = false
}: FollowStatsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <button 
          onClick={onFollowersClick}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <span className="font-bold text-white">{followersCount.toLocaleString()}</span>
          <span>followers</span>
        </button>
        <button 
          onClick={onFollowingClick}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <span className="font-bold text-white">{followingCount.toLocaleString()}</span>
          <span>following</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <button 
        onClick={onFollowersClick}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <Users size={16} />
        <span className="font-bold text-white">{followersCount.toLocaleString()}</span>
        <span className="text-sm">followers</span>
      </button>
      
      <div className="w-px h-4 bg-brand-border" />
      
      <button 
        onClick={onFollowingClick}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span className="font-bold text-white">{followingCount.toLocaleString()}</span>
        <span className="text-sm">following</span>
      </button>
    </div>
  )
}
