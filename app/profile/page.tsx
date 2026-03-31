'use client'

import { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { shortenAddress } from '@/lib/utils/helpers'
import { User, Save, Camera, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Image from 'next/image'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

export default function ProfilePage() {
  const { user, loading, refetch } = useUser()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set initial values when user loads
  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setBio(user.bio || '')
      setTwitter(user.twitter_handle || '')
      setDiscord(user.discord_handle || '')
      setWebsite(user.website_url || '')
    }
  }, [user])

  // ✅ FIXED: Direct supabase update with correct RLS
  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Please connect wallet first')
      return
    }

    setSaving(true)
    try {
      const cleanTwitter = twitter.replace('@', '')
      
      const { error } = await supabase
        .from('users')
        .update({
          username: username || null,
          bio: bio || null,
          twitter_handle: cleanTwitter || null,
          discord_handle: discord || null,
          website_url: website || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Update error:', error)
        throw error
      }
      
      toast.success('Profile updated!')
      refetch()
    } catch (e: any) { 
      console.error('Save error:', e)
      toast.error(e.message || 'Failed to save') 
    } finally { 
      setSaving(false) 
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user?.id) {
      toast.error('Please connect wallet first')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Avatar update error:', updateError)
        throw updateError
      }
      
      toast.success('Avatar updated!')
      refetch()
    } catch (e: any) {
      console.error('Upload error:', e)
      toast.error(e.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const getAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return url
    
    const cleanPath = url.replace(/^avatars\//, '')
    return `${supabaseUrl}/storage/v1/object/public/avatars/${cleanPath}`
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-8">My <span className="text-brand-green">Profile</span></h1>
          <div className="max-w-2xl space-y-6">
            {/* Profile Header */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center gap-5">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-full border-2 border-brand-green flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple text-brand-dark font-black text-3xl flex-shrink-0 overflow-hidden cursor-pointer group"
                  onClick={triggerFileInput}
                >
                  {user?.avatar_url ? (
                    <Image 
                      src={getAvatarUrl(user.avatar_url)} 
                      alt={user?.username || 'Avatar'} 
                      width={80} 
                      height={80}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || <User size={32} />
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                
                <button 
                  onClick={triggerFileInput}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-brand-dark hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
                
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{user?.username || 'Anonymous'}</h2>
                <p className="text-brand-green font-mono text-xs mt-1">{user ? shortenAddress(user.wallet_address, 8) : 'Not connected'}</p>
                <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full border capitalize ${
                  user?.role === 'admin' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                  user?.role === 'creator' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                  user?.role === 'brand' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-400/20'
                }`}>
                  {user?.role || 'user'}
                </span>
              </div>
            </div>

            {/* Social Links */}
            {(user?.twitter_handle || user?.discord_handle || user?.website_url) && (
              <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Social Links</h3>
                <div className="flex flex-wrap gap-3">
                  {user?.twitter_handle && (
                    <a 
                      href={`https://x.com/${user.twitter_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-gray-300 hover:text-brand-green hover:border-brand-green/30 transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      @{user.twitter_handle.replace('@', '')}
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {user?.discord_handle && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      {user.discord_handle}
                    </div>
                  )}
                  {user?.website_url && (
                    <a 
                      href={user.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-gray-300 hover:text-brand-green hover:border-brand-green/30 transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      Website
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[['Total Earned', `${user?.total_earned || 0} USDC`, 'text-brand-green'], ['Total Points', `${user?.total_points || 0} pts`, 'text-brand-purple'], ['Role', user?.role || '—', 'text-yellow-400'], ['Referral Code', user?.referral_code || '—', 'text-blue-400']].map(([label, val, col]) => (
                <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center">
                  <p className={`font-black text-lg ${col}`}>{val}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Edit Form */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg">Edit Profile</h2>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Username</label>
                <input 
                  className={INPUT} 
                  placeholder="Your username" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Twitter Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">@</span>
                  <input 
                    className={`${INPUT} pl-8`} 
                    placeholder="yourhandle" 
                    value={twitter} 
                    onChange={e => setTwitter(e.target.value)} 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Discord Username</label>
                <input 
                  className={INPUT} 
                  placeholder="username#0000" 
                  value={discord} 
                  onChange={e => setDiscord(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Website URL</label>
                <input 
                  className={INPUT} 
                  placeholder="https://yourwebsite.com" 
                  value={website} 
                  onChange={e => setWebsite(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 font-semibold block mb-2">Bio</label>
                <textarea 
                  className={`${INPUT} resize-none`} 
                  rows={3} 
                  placeholder="Tell us about yourself..." 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                />
              </div>
              
              <button 
                onClick={handleSave} 
                disabled={saving || loading}
                className="w-full bg-brand-green text-brand-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
