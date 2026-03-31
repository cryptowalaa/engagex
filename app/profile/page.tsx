'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { shortenAddress } from '@/lib/utils/helpers'
import { User, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

export default function ProfilePage() {
  const { user, updateUser, loading } = useUser()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Remove @ if user included it
      const cleanTwitter = twitter.replace('@', '')
      
      await updateUser({ 
        username: username || user?.username || '', 
        bio: bio || user?.bio || '', 
        twitter_handle: cleanTwitter || user?.twitter_handle || '' 
      })
      
      toast.success('Profile updated!')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to save') 
    }
    finally { setSaving(false) }
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
              <div className="w-16 h-16 rounded-full border-2 border-brand-green flex items-center justify-center bg-gradient-to-br from-brand-green to-brand-purple text-brand-dark font-black text-2xl flex-shrink-0">
                {user?.username?.[0]?.toUpperCase() || <User size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.username || 'Anonymous'}</h2>
                <p className="text-brand-green font-mono text-xs mt-1">{user ? shortenAddress(user.wallet_address, 8) : 'Not connected'}</p>
                <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full border capitalize ${user?.role==='admin'?'bg-brand-purple/10 text-brand-purple border-brand-purple/20':user?.role==='creator'?'bg-brand-green/10 text-brand-green border-brand-green/20':user?.role==='brand'?'bg-yellow-500/10 text-yellow-400 border-yellow-400/20':'bg-blue-500/10 text-blue-400 border-blue-400/20'}`}>{user?.role || 'user'}</span>
              </div>
            </div>

            {/* Stats - FIX: Added Total Points */}
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
                <input className={INPUT} placeholder={user?.username || 'Your username'} value={username} onChange={e => setUsername(e.target.value)} />
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
    </div>
  )
}
