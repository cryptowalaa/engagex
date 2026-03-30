'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Shield, Users, Target, FileText, Trophy, Heart, MessageCircle, Share2, Building2, CheckCircle, XCircle, Trash2, ExternalLink } from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import toast from 'react-hot-toast'
import type { Mission, User } from '@/types/database'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'

interface SubmissionWithEngagement {
  id: string
  content_link: string
  platform: string
  score: number
  creator: { username: string; wallet_address: string }
  mission: { title: string }
  engagement: { likes: number; comments: number; shares: number; watch_time: number }
}

interface BrandApplication extends User {
  website_url: string
  twitter_handle: string
  brand_submitted_at: string
}

export default function AdminDashboard() {
  const { publicKey } = useWallet()
  const [stats, setStats] = useState({ users: 0, missions: 0, submissions: 0, pendingBrands: 0 })
  const [pendingMissions, setPendingMissions] = useState<Mission[]>([])
  const [pendingBrands, setPendingBrands] = useState<BrandApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<SubmissionWithEngagement[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ likes: 0, comments: 0, shares: 0, watch_time: 0 })
  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  async function load() {
    const [
      {count: uc},
      {count: mc},
      {count: sc},
      {data: pm},
      {data: pb},
      {data: us}
    ] = await Promise.all([
      supabase.from('users').select('*', {count: 'exact', head: true}),
      supabase.from('missions').select('*', {count: 'exact', head: true}),
      supabase.from('submissions').select('*', {count: 'exact', head: true}),
      supabase.from('missions').select('*').eq('status', 'draft').order('created_at', {ascending: false}),
      (supabase.from('users') as any).select('*').eq('brand_status', 'pending').order('brand_submitted_at', {ascending: false}),
      supabase.from('users').select('*').order('created_at', {ascending: false}).limit(10),
    ])
    
    setStats({
      users: uc || 0, 
      missions: mc || 0, 
      submissions: sc || 0,
      pendingBrands: pb?.length || 0
    })
    setPendingMissions(pm || [])
    setPendingBrands(pb || [])
    setUsers(us || [])
    
    await loadSubmissions()
    setLoading(false)
  }

  async function loadSubmissions() {
    const { data: subs } = await (supabase
      .from('submissions') as any)
      .select('*, creator:users(username, wallet_address), mission:missions(title), engagement:engagements(*)')
      .order('score', { ascending: false })
      .limit(20)
    
    setSubmissions(subs || [])
  }

  // ✅ NEW: Approve Brand
  const approveBrand = async (userId: string) => {
    try {
      await (supabase.from('users') as any)
        .update({
          role: 'brand',
          brand_status: 'approved',
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      setPendingBrands(p => p.filter(b => b.id !== userId))
      toast.success('Brand approved and verified!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve')
    }
  }

  // ✅ NEW: Reject Brand
  const rejectBrand = async (userId: string) => {
    try {
      await (supabase.from('users') as any)
        .update({
          role: 'user',
          brand_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      setPendingBrands(p => p.filter(b => b.id !== userId))
      toast.success('Brand application rejected')
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject')
    }
  }

  const approveMission = async (id: string) => { 
    await (supabase.from('missions') as any).update({status: 'active'}).eq('id', id)
    setPendingMissions(p => p.filter(m => m.id !== id))
    toast.success('Mission approved!') 
  }

  const rejectMission = async (id: string) => { 
    await (supabase.from('missions') as any).update({status: 'cancelled'}).eq('id', id)
    setPendingMissions(p => p.filter(m => m.id !== id))
    toast.success('Mission rejected') 
  }

  // ✅ NEW: Delete Mission
  const deleteMission = async (id: string) => {
    if (!confirm('Are you sure? This will delete the mission permanently!')) return
    
    try {
      // First delete related submissions and engagements
      await (supabase.from('submissions') as any).delete().eq('mission_id', id)
      await (supabase.from('missions') as any).delete().eq('id', id)
      
      setPendingMissions(p => p.filter(m => m.id !== id))
      toast.success('Mission deleted permanently')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete mission')
    }
  }

  const startEdit = (sub: SubmissionWithEngagement) => {
    setEditingSubmission(sub.id)
    setEditForm({
      likes: sub.engagement?.likes || 0,
      comments: sub.engagement?.comments || 0,
      shares: sub.engagement?.shares || 0,
      watch_time: sub.engagement?.watch_time || 0
    })
  }

  const saveEngagement = async (submissionId: string) => {
    try {
      await (supabase.from('engagements') as any)
        .update({
          likes: editForm.likes,
          comments: editForm.comments,
          shares: editForm.shares,
          watch_time: editForm.watch_time,
          updated_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)
      
      toast.success('Engagement updated!')
      setEditingSubmission(null)
      await loadSubmissions()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this submission?')) return
    try {
      await (supabase.from('submissions') as any).delete().eq('id', id)
      toast.success('Deleted!')
      await loadSubmissions()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  if (!isAdmin) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <Navbar />
      <div className="text-center">
        <Shield size={48} className="text-red-400 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
        <p className="text-gray-400 mt-2">Admin wallet required</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3">
                <Shield size={28} className="text-brand-purple"/>
                Admin <span className="text-brand-purple">Panel</span>
              </h1>
              <p className="text-gray-500 font-mono text-xs mt-1">{publicKey?.toBase58()}</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/20 rounded-xl px-4 py-2">
              <Shield size={14} className="text-brand-purple"/>
              <span className="text-brand-purple font-bold text-sm">ADMIN ACCESS</span>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-brand-card rounded-2xl animate-pulse border border-brand-border"/>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400'},
                {label: 'Total Missions', value: stats.missions, icon: Target, color: 'text-brand-green'},
                {label: 'Submissions', value: stats.submissions, icon: FileText, color: 'text-brand-purple'},
                {label: 'Pending Brands', value: stats.pendingBrands, icon: Building2, color: 'text-yellow-400'},
              ].map(({label, value, icon: Icon, color}) => (
                <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <Icon size={16} className={color}/>
                  </div>
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ✅ NEW: Brand Applications Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-yellow-400"/>
              Brand Applications
              {pendingBrands.length > 0 && (
                <span className="ml-2 text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                  {pendingBrands.length} pending
                </span>
              )}
            </h2>
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              {pendingBrands.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No pending applications</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-brand-border">
                      <tr>
                        {['Wallet', 'Website', 'Twitter', 'Socials', 'Applied', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingBrands.map(brand => (
                        <tr key={brand.id} className="border-b border-brand-border/40 hover:bg-white/2">
                          <td className="px-4 py-4 font-mono text-brand-green text-xs">
                            {shortenAddress(brand.wallet_address, 6)}
                          </td>
                          <td className="px-4 py-4">
                            <a 
                              href={brand.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-brand-green hover:underline"
                            >
                              <ExternalLink size={12} />
                              Website
                            </a>
                          </td>
                          <td className="px-4 py-4 text-gray-300">@{brand.twitter_handle}</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 text-xs">
                              {brand.discord_handle && <span className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded">Discord</span>}
                              {brand.linkedin_url && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">LinkedIn</span>}
                              {brand.telegram_handle && <span className="bg-blue-400/10 text-blue-300 px-2 py-0.5 rounded">Telegram</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-500 text-xs">
                            {new Date(brand.brand_submitted_at!).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => approveBrand(brand.id)} 
                                className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-green/20"
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button 
                                onClick={() => rejectBrand(brand.id)} 
                                className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/20"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pending Missions */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target size={20} className="text-brand-green"/>
              Pending Missions
              {pendingMissions.length > 0 && (
                <span className="ml-2 text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                  {pendingMissions.length}
                </span>
              )}
            </h2>
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              {pendingMissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">All caught up!</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-brand-border">
                    <tr>
                      {['Mission', 'Brand', 'Pool', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMissions.map(m => (
                      <tr key={m.id} className="border-b border-brand-border/40">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{m.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-xs">
                          {shortenAddress(m.brand_id, 6)}
                        </td>
                        <td className="px-4 py-4 font-bold text-brand-green">
                          {m.reward_pool} {m.currency}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveMission(m.id)} 
                              className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold"
                            >
                              ✅ Approve
                            </button>
                            <button 
                              onClick={() => rejectMission(m.id)} 
                              className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold"
                            >
                              ❌ Reject
                            </button>
                            <button 
                              onClick={() => deleteMission(m.id)} 
                              className="text-xs bg-gray-500/10 text-gray-400 border border-gray-400/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/20"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Top Submissions */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400"/>
              Top Submissions
            </h2>
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No submissions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-brand-border">
                      <tr>
                        {['Rank', 'Creator', 'Mission', 'Engagement', 'Score', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, index) => (
                        <tr key={sub.id} className="border-b border-brand-border/40 hover:bg-white/2">
                          <td className="px-4 py-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' : 
                              index === 1 ? 'bg-gray-400 text-black' : 
                              index === 2 ? 'bg-orange-500 text-black' : 
                              'bg-brand-border text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white text-sm">
                              {sub.creator?.username || shortenAddress(sub.creator?.wallet_address || '', 4)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-sm max-w-[150px] truncate">
                            {sub.mission?.title}
                          </td>
                          <td className="px-4 py-3">
                            {editingSubmission === sub.id ? (
                              <div className="flex gap-2 text-xs">
                                <input 
                                  type="number" 
                                  value={editForm.likes} 
                                  onChange={e => setEditForm({...editForm, likes: parseInt(e.target.value) || 0})} 
                                  className="w-14 bg-brand-dark border border-brand-border rounded px-2 py-1 text-white" 
                                  placeholder="❤️"
                                />
                                <input 
                                  type="number" 
                                  value={editForm.comments} 
                                  onChange={e => setEditForm({...editForm, comments: parseInt(e.target.value) || 0})} 
                                  className="w-14 bg-brand-dark border border-brand-border rounded px-2 py-1 text-white" 
                                  placeholder="💬"
                                />
                                <input 
                                  type="number" 
                                  value={editForm.shares} 
                                  onChange={e => setEditForm({...editForm, shares: parseInt(e.target.value) || 0})} 
                                  className="w-14 bg-brand-dark border border-brand-border rounded px-2 py-1 text-white" 
                                  placeholder="🔄"
                                />
                              </div>
                            ) : (
                              <div className="flex gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Heart size={12} className="text-red-400"/>{sub.engagement?.likes || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={12} className="text-blue-400"/>{sub.engagement?.comments || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Share2 size={12} className="text-green-400"/>{sub.engagement?.shares || 0}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-brand-green font-bold text-lg">
                              {sub.score?.toFixed(0) || 0}
                            </span>
                            <span className="text-xs text-gray-500">pts</span>
                          </td>
                          <td className="px-4 py-3">
                            {editingSubmission === sub.id ? (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => saveEngagement(sub.id)} 
                                  className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold"
                                >
                                  💾 Save
                                </button>
                                <button 
                                  onClick={() => setEditingSubmission(null)} 
                                  className="text-xs bg-gray-500/10 text-gray-400 border border-gray-400/20 px-3 py-1.5 rounded-lg font-semibold"
                                >
                                  ❌ Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => startEdit(sub)} 
                                  className="text-xs bg-blue-500/10 text-blue-400 border border-blue-400/20 px-3 py-1.5 rounded-lg font-semibold"
                                >
                                  ✏️ Edit
                                </button>
                                <button 
                                  onClick={() => deleteSubmission(sub.id)} 
                                  className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Users</h2>
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-brand-border">
                  <tr>
                    {['Wallet', 'Role', 'Status', 'Earned', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-brand-border/40 hover:bg-white/2">
                      <td className="px-4 py-3 font-mono text-brand-green text-xs">
                        {shortenAddress(u.wallet_address, 6)}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          u.role === 'admin' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                          u.role === 'brand' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                          u.role === 'brand_pending' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-400/20'
                        }`}>
                          {u.role === 'brand_pending' ? 'pending' : u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_verified && (
                          <span className="flex items-center gap-1 text-xs text-brand-green">
                            <CheckCircle size={12} className="fill-current" /> Verified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-green font-bold">
                        {formatUSDC(u.total_earned)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
