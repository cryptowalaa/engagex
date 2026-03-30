'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Shield, Building2, CheckCircle, XCircle, ExternalLink, Globe, Twitter } from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import toast from 'react-hot-toast'
import { shortenAddress } from '@/lib/utils/helpers'

interface BrandApplication {
  id: string
  wallet_address: string
  username: string | null
  website_url: string
  twitter_handle: string
  discord_handle: string | null
  linkedin_url: string | null
  telegram_handle: string | null
  bio: string | null
  brand_submitted_at: string
}

export default function AdminBrandsPage() {
  const { publicKey } = useWallet()
  const [pendingBrands, setPendingBrands] = useState<BrandApplication[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  useEffect(() => {
    if (!isAdmin) return
    loadPendingBrands()
  }, [isAdmin])

  async function loadPendingBrands() {
    try {
      const { data } = await (supabase.from('users') as any)
        .select('*')
        .eq('brand_status', 'pending')
        .order('brand_submitted_at', { ascending: false })
      
      setPendingBrands(data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
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
                <Building2 size={28} className="text-brand-purple"/>
                Brand <span className="text-brand-purple">Applications</span>
              </h1>
              <p className="text-gray-500 font-mono text-xs mt-1">{publicKey?.toBase58()}</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/20 rounded-xl px-4 py-2">
              <Shield size={14} className="text-brand-purple"/>
              <span className="text-brand-purple font-bold text-sm">ADMIN ACCESS</span>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : pendingBrands.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={48} className="text-brand-green mx-auto mb-4"/>
                <p className="text-gray-400">No pending applications</p>
                <p className="text-sm text-gray-500 mt-2">All caught up!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-brand-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Wallet</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Website</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Twitter</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Socials</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Applied</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Actions</th>
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
                            <Globe size={12} />
                            Website
                            <ExternalLink size={10} />
                          </a>
                        </td>
                        <td className="px-4 py-4 text-gray-300">
                          <a 
                            href={`https://twitter.com/${brand.twitter_handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-brand-green transition-colors"
                          >
                            <Twitter size={12} />
                            @{brand.twitter_handle.replace('@', '')}
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {brand.discord_handle && (
                              <span className="text-xs bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded">Discord</span>
                            )}
                            {brand.linkedin_url && (
                              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">LinkedIn</span>
                            )}
                            {brand.telegram_handle && (
                              <span className="text-xs bg-blue-400/10 text-blue-300 px-2 py-0.5 rounded">Telegram</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs">
                          {brand.brand_submitted_at ? new Date(brand.brand_submitted_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveBrand(brand.id)} 
                              className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-green/20 transition-all"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button 
                              onClick={() => rejectBrand(brand.id)} 
                              className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/20 transition-all"
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
        </main>
      </div>
    </div>
  )
}
