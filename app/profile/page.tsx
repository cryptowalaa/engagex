'use client'

import { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { shortenAddress } from '@/lib/utils/helpers'
import { User, Save, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Image from 'next/image'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

export default function ProfilePage() {
  const { user, loading: userLoading, refetch } = useUser()
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

  const handleSave = async () => {
    if (!user?.wallet_address) {
      toast.error('Please connect wallet first')
      return
    }

    setSaving(true)
    try {
      const cleanTwitter = twitter.replace('@', '')
      
      // ✅ FIXED: Type assertion to avoid TypeScript error
      const updates: any = {
        username: username || null,
        bio: bio || null,
        twitter_handle: cleanTwitter || null,
        discord_handle: discord || null,
        website_url: website || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('wallet_address', user.wallet_address)

      if (error) throw error
      
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
    if (!user?.wallet_address) {
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
      const filePath = `${user.wallet_address}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', user.wallet_address)

      if (updateError) throw updateError
      
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

  // Show loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-2xl mx-auto text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-8">My <span className="text-brand-green">Profile</span></h1>
          
          {!user ? (
            <div className="max-w-2xl bg-brand-card border border-brand-border rounded-2xl p-8 text-center">
              <User size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Please connect your wallet to view profile</p>
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">
              {/* Profile Header */}
              <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex items-center gap-5">
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-brand-green flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple text-brand-dark font-black text-3xl flex-shrink-0 overflow-hidden cursor-pointer group"
                    onClick={triggerFileInput}
                  >
                    {user.avatar_url ? (
                      <Image 
                        src={getAvatarUrl(user.avatar_url)} 
                        alt={user.username || 'Avatar'} 
                        width={80} 
                        height={80}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      user.username?.[0]?.toUpperCase() || <User size={32} />
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
                  <h2 className="text-xl font-bold text-white">{user.username || 'Anonymous'}</h2>
                  <p className="text-brand-green font-mono text-xs mt-1">
                    {shortenAddress(user.wallet_address, 8)}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full border capitalize ${
                    user.role === 'admin' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                    user.role === 'creator' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                    user.role === 'brand' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-400/20'
                  }`}>
                    {user.role || 'user'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center">
                  <p className="font-black text-lg text-brand-green">{user.total_earned || 0} USDC</p>
                  <p className="text-xs text-gray-500 mt-1">Total Earned</p>
                </div>
                <div className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center">
                  <p className="font-black text-lg text-brand-purple">{user.total_points || 0} pts</p>
                  <p className="text-xs text-gray-500 mt-1">Total Points</p>
                </div>
                <div className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center">
                  <p className="font-black text-lg text-yellow-400">{user.role || '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">Role</p>
                </div>
                <div className="bg-brand-card border border-brand-border rounded-2xl p-4 text-center">
                  <p className="font-black text-lg text-blue-400">{user.referral_code || '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">Referral Code</p>
                </div>
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
                  disabled={saving || userLoading}
                  className="w-full bg-brand-green text-brand-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
