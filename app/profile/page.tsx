'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { shortenAddress } from '@/lib/utils/helpers'
import { User, Save, ImageIcon, Link as LinkIcon, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { ProfileShareCard } from '@/components/profile/profile-share-card'
import { useProfileStats } from '@/hooks/use-profile-stats'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

export default function ProfilePage() {
  const { user, updateUser, loading } = useUser()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  
  const { stats } = useProfileStats(user?.id || null)

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setBio(user.bio || '')
      setTwitter(user.twitter_handle || '')
      setAvatarUrl(user.avatar_url || '')
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleanTwitter = twitter.replace('@', '')
      
      await updateUser({ 
        username: username || user?.username || '', 
        bio: bio || user?.bio || '', 
        twitter_handle: cleanTwitter || user?.twitter_handle || '',
        avatar_url: avatarUrl || user?.avatar_url || ''
      })
      
      toast.success('Profile updated!')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to save') 
    }
    finally { setSaving(false) }
  }

  const shareCardUser = user ? {
    ...user,
    ...stats,
    submissions_count: stats.submissions_count
  } : null

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black">My <span className="text-brand-green">Profile</span></h1>
            
            {user && (
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00FFE0]/20 to-[#FF2E63]/20 border border-[#00FFE0]/50 text-[#00FFE0] font-bold rounded-xl hover:from-[#00FFE0]/30 hover:to-[#FF2E63]/30 transition-all"
              >
                <Share2 size={18} />
                Share Profile
              </button>
            )}
          </div>
          
          <div className="max-w-2xl space-y-6">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center gap-5">
              <div className="w-20 h-20 rounded-full border-2 border-brand-green flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple text-brand-dark font-black text-3xl flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  user?.username?.[0]?.toUpperCase() || <User size={28} />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user?.username || 'Anonymous'}</h2>
                <p className="text-brand-green font-mono text-xs mt-1">{user ? shortenAddress(user.wallet_address, 8) : 'Not connected'}</p>
                <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full border capitalize ${
                  user?.role==='admin' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                  user?.role==='creator' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                  user?.role==='brand' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-400/20'
                }`}>
                  {user?.role || 'user'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[['Total Earned', `${user?.total_earned || 0} USDC`, 'text-brand-green'], ['Total Points', `${user?.total_points || 0} pts`, 'text-brand-purple'], ['Role', user?.role || '—', 'text-yellow-400'], ['Referral Code', user?.referral_code || '—', 'text-blue-400']].map(([label, val, col]) => (
                <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center">
                  <p className={`font-black text-lg ${col}`}>{val}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg">Edit Profile</h2>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2 flex items-center gap-2">
                  <ImageIcon size={14} /> Profile Avatar URL
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-4 top-3.5 text-gray-500" />
                  <input 
                    className={`${INPUT} pl-10`} 
                    placeholder="https://i.imgur.com/..." 
                    value={avatarUrl} 
                    onChange={e => setAvatarUrl(e.target.value)} 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Paste image URL (Imgur, Cloudinary, etc.)</p>
                
                {avatarUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-gray-400">Preview:</span>
                    <div className="w-12 h-12 rounded-full border border-brand-border overflow-hidden">
                      <img 
                        src={avatarUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ''
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Username</label>
                <input className={INPUT} placeholder="Your username" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Twitter Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">@</span>
                  <input className={`${INPUT} pl-8`} placeholder="yourhandle" value={twitter} onChange={e => setTwitter(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Bio</label>
                <textarea className={`${INPUT} resize-none`} rows={3} placeholder="Tell us about yourself..." value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              
              <button onClick={handleSave} disabled={saving || loading}
                className="w-full bg-brand-green text-brand-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50">
                <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>

      <ProfileShareCard 
        user={shareCardUser}
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        type={user?.role === 'brand' ? 'brand' : 'creator'}
      />
    </div>
  )
}
