'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  X, Twitter, Globe, MessageCircle, Trophy, 
  FileText, Star, ExternalLink, Award 
} from 'lucide-react'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'
import Link from 'next/link'

interface CreatorProfileModalProps {
  creator: {
    id: string
    wallet_address: string
    username: string | null
    avatar_url: string | null
    bio: string | null
    twitter_handle: string | null
    discord_handle: string | null
    total_earned: number
    total_points: number
  } | null
  isOpen: boolean
  onClose: () => void
}

interface Submission {
  id: string
  mission_title: string
  score: number
  status: string
  platform: string
}

export function CreatorProfileModal({ creator, isOpen, onClose }: CreatorProfileModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!creator || !isOpen) return
    
    async function loadSubmissions() {
      setLoading(true)
      try {
        const { data } = await (supabase.from('submissions') as any)
          .select('id, score, status, platform, mission:missions(title)')
          .eq('creator_id', creator.id)
          .order('score', { ascending: false })
          .limit(5)
        
        const formatted = data?.map((sub: any) => ({
          id: sub.id,
          mission_title: sub.mission?.title || 'Unknown Mission',
          score: sub.score || 0,
          status: sub.status,
          platform: sub.platform
        })) || []
        
        setSubmissions(formatted)
      } catch (error) {
        console.error('Load submissions error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSubmissions()
  }, [creator, isOpen])

  if (!isOpen || !creator) return null

  // FIXED: Avatar component with proper image handling
  const AvatarImage = ({ url, name }: { url: string | null, name: string | null }) => {
    const [error, setError] = useState(false)
    const [loaded, setLoaded] = useState(false)
    
    if (!url || error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple">
          <span className="text-3xl font-black text-white">
            {name?.[0]?.toUpperCase() || 'C'}
          </span>
        </div>
      )
    }
    
    return (
      <div className="relative w-full h-full">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple">
            <span className="text-3xl font-black text-white">
              {name?.[0]?.toUpperCase() || 'C'}
            </span>
          </div>
        )}
        <img 
          src={url} 
          alt={name || 'Creator'} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-brand-card border border-brand-border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-green/50 transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-8 text-center border-b border-brand-border">
          {/* FIXED: Avatar with AvatarImage component */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-green to-brand-purple flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <AvatarImage url={creator.avatar_url} name={creator.username} />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            {creator.username || 'Anonymous Creator'}
          </h2>
          
          <p className="text-brand-green font-mono text-sm mb-4">
            {shortenAddress(creator.wallet_address, 8)}
          </p>

          {creator.bio && (
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-4">
              {creator.bio}
            </p>
          )}

          {/* Social Links */}
          <div className="flex justify-center gap-3">
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-brand-border">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mx-auto mb-2">
              <Trophy size={20} className="text-brand-green" />
            </div>
            <p className="text-xl font-black text-white">{creator.total_earned || 0}</p>
            <p className="text-xs text-gray-500">Total Earned</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-2">
              <Star size={20} className="text-brand-purple" />
            </div>
            <p className="text-xl font-black text-white">{creator.total_points || 0}</p>
            <p className="text-xs text-gray-500">Total Points</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-2">
              <FileText size={20} className="text-yellow-400" />
            </div>
            <p className="text-xl font-black text-white">{submissions.length}</p>
            <p className="text-xs text-gray-500">Submissions</p>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award size={18} className="text-brand-green" />
            Top Submissions
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-brand-dark rounded-xl animate-pulse" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={32} className="mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div 
                  key={sub.id}
                  className="flex items-center justify-between p-4 bg-brand-dark border border-brand-border rounded-xl"
                >
                  <div>
                    <p className="font-medium text-white text-sm mb-1">{sub.mission_title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{sub.platform}</span>
                      <span>•</span>
                      <span className={`${
                        sub.status === 'winner' ? 'text-brand-green' : 
                        sub.status === 'approved' ? 'text-blue-400' : 
                        'text-gray-400'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-green font-bold">{sub.score.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand-border">
          <Link 
            href={`/creator/${creator.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-brand-green text-brand-dark font-bold rounded-xl hover:bg-opacity-90 transition-all"
          >
            View Full Profile <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
