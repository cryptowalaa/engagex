'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { 
  Shield, Users, Target, FileText, Trophy, Heart, MessageCircle, 
  Share2, Building2, CheckCircle, XCircle, Trash2, ExternalLink, 
  Sparkles, Crown, Clock, Wallet, Check, Star, ImageIcon, Link as LinkIcon
} from 'lucide-react'
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

interface BadgePayment {
  id: string
  user_id: string
  badge_type: 'blue' | 'gold'
  amount: number
  currency: string
  transaction_signature: string
  treasury_wallet: string
  status: string
  created_at: string
  user?: {
    username: string
    wallet_address: string
  }
}

interface MissionWithPayment extends Mission {
  payment_status?: string
  payment_tx?: string
  paid_at?: string
}

export default function AdminDashboard() {
  const { publicKey } = useWallet()
  const [stats, setStats] = useState({ 
    users: 0, 
    missions: 0, 
    submissions: 0, 
    pendingBrands: 0,
    badgePayments: 0,
    pendingPayments: 0
  })
  const [pendingMissions, setPendingMissions] = useState<MissionWithPayment[]>([])
  const [pendingBrands, setPendingBrands] = useState<BrandApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<SubmissionWithEngagement[]>([])
  const [badgePayments, setBadgePayments] = useState<BadgePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ likes: 0, comments: 0, shares: 0, watch_time: 0 })
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({})
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'blue' | 'gold'>('all')
  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  async function load() {
    try {
      const [
        {count: uc},
        {count: mc},
        {count: sc},
        {count: bpc},
        {data: pm},
        {data: pb},
        {data: us},
        {data: bp}
      ] = await Promise.all([
        supabase.from('users').select('*', {count: 'exact', head: true}),
        supabase.from('missions').select('*', {count: 'exact', head: true}),
        supabase.from('submissions').select('*', {count: 'exact', head: true}),
        supabase.from('badge_payments').select('*', {count: 'exact', head: true}),
        (supabase.from('missions') as any)
          .select('*')
          .eq('status', 'draft')
          .order('created_at', {ascending: false}),
        (supabase.from('users') as any).select('*').eq('brand_status', 'pending').order('brand_submitted_at', {ascending: false}),
        supabase.from('users').select('*').order('created_at', {ascending: false}).limit(50),
        (supabase.from('badge_payments') as any)
          .select('*, user:users(username, wallet_address)')
          .order('created_at', {ascending: false})
          .limit(50)
      ])
      
      const pendingPaymentCount = (pm || []).filter((m: any) => m.payment_status === 'pending').length
      
      setStats({
        users: uc || 0, 
        missions: mc || 0, 
        submissions: sc || 0,
        pendingBrands: pb?.length || 0,
        badgePayments: bpc || 0,
        pendingPayments: pendingPaymentCount
      })
      setPendingMissions(pm || [])
      setPendingBrands(pb || [])
      setUsers(us || [])
      setBadgePayments(bp || [])
      
      const urls: Record<string, string> = {}
      ;(us || []).forEach((u: any) => {
        if (u.logo_url) urls[u.id] = u.logo_url
      })
      setLogoUrls(urls)
      
      await loadSubmissions()
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  async function loadSubmissions() {
    const { data: subs } = await (supabase
      .from('submissions') as any)
      .select('*, creator:users(username, wallet_address), mission:missions(title), engagement:engagements(*)')
      .order('score', { ascending: false })
      .limit(20)
    
    setSubmissions(subs || [])
  }

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
    try {
      await (supabase.from('missions') as any)
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      setPendingMissions(p => p.filter(m => m.id !== id))
      toast.success('Mission approved and activated!') 
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve')
    }
  }

  const rejectMission = async (id: string) => { 
    try {
      await (supabase.from('missions') as any)
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      setPendingMissions(p => p.filter(m => m.id !== id))
      toast.success('Mission rejected') 
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject')
    }
  }

  const deleteMission = async (id: string) => {
    if (!confirm('Are you sure? This will delete the mission permanently!')) return
    
    try {
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

  const updateLogoUrl = async (brandId: string, url: string) => {
    try {
      await (supabase.from('users') as any)
        .update({ logo_url: url })
        .eq('id', brandId)
      
      setLogoUrls(prev => ({ ...prev, [brandId]: url }))
      toast.success('Logo URL updated!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update logo')
    }
  }

  const removeLogo = async (brandId: string) => {
    if (!confirm('Remove this logo URL?')) return
    
    try {
      await (supabase.from('users') as any)
        .update({ logo_url: null })
        .eq('id', brandId)
      
      setLogoUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[brandId]
        return newUrls
      })
      
      toast.success('Logo removed!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove logo')
    }
  }

  const filteredBadgePayments = badgePayments.filter(p => 
    badgeFilter === 'all' ? true : p.badge_type === badgeFilter
  )

  const totalBadgeRevenue = badgePayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const PaymentStatusBadge = ({ mission }: { mission: MissionWithPayment }) => {
    const isPaid = mission.payment_status === 'completed' || (mission.payment_tx && mission.payment_tx.length > 0)
    
    if (isPaid) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-400/20 w-fit">
            <CheckCircle size={10} /> Paid
          </span>
          {mission.payment_tx && (
            <a 
              href={`https://solscan.io/tx/${mission.payment_tx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-purple hover:text-brand-green flex items-center gap-1"
            >
              View Tx <ExternalLink size={10} />
            </a>
          )}
        </div>
      )
    }
    
    if (mission.payment_status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <Clock size={10} /> Pending Payment
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-400/20">
        <XCircle size={10} /> Not Paid
      </span>
    )
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
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 bg-brand-card rounded-2xl animate-pulse border border-brand-border"/>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                {label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400'},
                {label: 'Total Missions', value: stats.missions, icon: Target, color: 'text-brand-green'},
                {label: 'Submissions', value: stats.submissions, icon: FileText, color: 'text-brand-purple'},
                {label: 'Pending Brands', value: stats.pendingBrands, icon: Building2, color: 'text-yellow-400'},
                {label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'text-orange-400'},
                {label: 'Badge Sales', value: `$${totalBadgeRevenue.toFixed(0)}`, icon: Sparkles, color: 'text-pink-400'},
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

          {/* Badge Payments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-pink-400"/>
                Badge Payments
                <span className="ml-2 text-xs bg-pink-400/10 text-pink-400 border border-pink-400/20 px-2 py-0.5 rounded-full">
                  {badgePayments.length} total
                </span>
              </h2>
              <div className="flex gap-2">
                {(['all', 'blue', 'gold'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setBadgeFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      badgeFilter === filter
                        ? 'bg-brand-purple text-white'
                        : 'bg-brand-card border border-brand-border text-gray-400 hover:border-brand-purple/30'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'blue' ? 'Verified' : 'Official'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              {badgePayments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-600" />
                  <p>No badge payments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-brand-border bg-brand-dark/50">
                      <tr>
                        {['User', 'Badge Type', 'Amount', 'Transaction', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBadgePayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-brand-border/40 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-brand-green text-xs">
                                {shortenAddress(payment.user?.wallet_address || payment.user_id, 6)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {payment.user?.username || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              payment.badge_type === 'gold'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {payment.badge_type === 'gold' ? (
                                <><Crown size={12} /> OFFICIAL</>
                              ) : (
                                <><CheckCircle size={12} /> VERIFIED</>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-brand-green font-bold">
                              <Wallet size={14} />
                              {payment.amount} {payment.currency}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <a 
                              href={`https://solscan.io/tx/${payment.transaction_signature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-brand-purple hover:text-brand-green transition-colors"
                            >
                              <span className="font-mono text-xs">{shortenAddress(payment.transaction_signature, 8)}</span>
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td className="px-4 py-4 text-gray-400 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(payment.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'completed'
                                ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              <CheckCircle size={10} />
                              {payment.status}
                            </span>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-brand-border">
                      <tr>
                        {['Mission', 'Brand', 'Pool', 'Payment Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMissions.map(m => (
                        <tr key={m.id} className="border-b border-brand-border/40 hover:bg-white/5">
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
                            <PaymentStatusBadge mission={m} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              {(m.payment_status === 'completed' || (m.payment_tx && m.payment_tx.length > 0)) ? (
                                <button 
                                  onClick={() => approveMission(m.id)} 
                                  className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-green/20"
                                >
                                  <Check size={14} className="inline mr-1" /> Approve
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500 italic px-3 py-1.5 flex items-center gap-1">
                                  <Clock size={12} /> Awaiting Payment
                                </span>
                              )}
                              <button 
                                onClick={() => rejectMission(m.id)} 
                                className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/20"
                              >
                                <XCircle size={14} className="inline mr-1" /> Reject
                              </button>
                              <button 
                                onClick={() => deleteMission(m.id)} 
                                className="text-xs bg-gray-500/10 text-gray-400 border border-gray-400/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/20"
                              >
                                <Trash2 size={14} />
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

          {/* Brand Applications */}
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
                        <tr key={brand.id} className="border-b border-brand-border/40 hover:bg-white/5">
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

          {/* Brand Logo Management */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-blue-400"/>
              Brand Logo Management
              <span className="ml-2 text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full">
                {users.filter((u: any) => u.role === 'brand' && u.is_verified).length} brands
              </span>
            </h2>
            <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-brand-border bg-blue-400/5">
                <p className="text-sm text-blue-400">
                  Enter logo image URL manually (Imgur, Cloudinary, etc.). 
                  No file upload - 100% safe for database.
                </p>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users
                    .filter((u: any) => u.role === 'brand' && u.is_verified)
                    .map((brand: any) => (
                    <div key={brand.id} className="bg-brand-dark border border-brand-border rounded-xl p-4 hover:border-blue-400/30 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-purple to-brand-green flex items-center justify-center overflow-hidden border-2 border-brand-border flex-shrink-0">
                          {logoUrls[brand.id] ? (
                            <img 
                              src={logoUrls[brand.id]} 
                              alt={brand.username} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className="text-2xl font-bold text-white">
                              {brand.username?.[0]?.toUpperCase() || 'B'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {brand.username || 'Unnamed Brand'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {shortenAddress(brand.wallet_address, 6)}
                          </p>
                          {brand.is_official_verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-[#FFAD1F]/10 text-[#FFAD1F] px-1.5 py-0.5 rounded mt-1">
                              <Crown size={8} /> Official
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="url"
                            placeholder="https://i.imgur.com/..."
                            defaultValue={logoUrls[brand.id] || ''}
                            onBlur={(e) => updateLogoUrl(brand.id, e.target.value)}
                            className="w-full bg-brand-card border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-400/50 focus:outline-none"
                          />
                        </div>
                        
                        {logoUrls[brand.id] && (
                          <button
                            onClick={() => removeLogo(brand.id)}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 size={14} /> Remove Logo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {users.filter((u: any) => u.role === 'brand' && u.is_verified).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon size={48} className="mx-auto mb-3 text-gray-700" />
                    <p>No verified brands found</p>
                    <p className="text-sm mt-1">Approve brand applications first</p>
                  </div>
                )}
              </div>
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
                        <tr key={sub.id} className="border-b border-brand-border/40 hover:bg-white/5">
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
                    {['Wallet', 'Role', 'Status', 'Badge', 'Earned', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 20).map(u => (
                    <tr key={u.id} className="border-b border-brand-border/40 hover:bg-white/5">
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
                      <td className="px-4 py-3">
                        {(u as any).badge_type && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            (u as any).badge_type === 'gold' 
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {(u as any).badge_type === 'gold' ? <Crown size={10} /> : <CheckCircle size={10} />}
                            {(u as any).badge_type === 'gold' ? 'Official' : 'Verified'}
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
