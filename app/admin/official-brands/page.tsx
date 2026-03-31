'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Shield, Crown, CheckCircle, XCircle, Search, Star } from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import toast from 'react-hot-toast'
import { shortenAddress } from '@/lib/utils/helpers'
import { YellowTick } from '@/components/badges/OfficialVerifiedBadge'

interface UserWithBrand {
  id: string
  wallet_address: string
  username: string | null
  role: string
  is_verified: boolean
  is_official_verified: boolean
  total_earned: number
  created_at: string
}

export default function AdminOfficialBrandsPage() {
  const { publicKey } = useWallet()
  const [users, setUsers] = useState<UserWithBrand[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

  async function loadUsers() {
    try {
      const { data } = await (supabase.from('users') as any)
        .select('*')
        .eq('role', 'brand')
        .order('created_at', { ascending: false })

      setUsers(data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOfficialVerified = async (userId: string, currentStatus: boolean) => {
    try {
      await (supabase.from('users') as any)
        .update({
          is_official_verified: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, is_official_verified: !currentStatus }
          : u
      ))

      toast.success(currentStatus ? 'Official verification removed' : 'Official verification granted!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    }
  }

  const filteredUsers = users.filter(u => 
    u.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAdmin) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <Navbar />
      <div className="text-center">
        <Shield size={48} className="text-red-400 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
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
                <Crown size={28} className="text-yellow-400"/>
                Official <span className="text-yellow-400">Brands</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage yellow verified badges for premium brands
              </p>
            </div>
            <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2">
              <Star size={14} className="text-yellow-400"/>
              <span className="text-yellow-400 font-bold text-sm">OFFICIAL ACCESS</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by wallet or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-card border border-brand-border rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
            />
          </div>

          {/* Brands Table */}
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Crown size={48} className="text-gray-700 mx-auto mb-4"/>
                <p className="text-gray-400">No brands found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-brand-border bg-yellow-400/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Brand</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Wallet</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Badges</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-brand-border/40 hover:bg-white/2">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold">
                              {user.username?.[0]?.toUpperCase() || 'B'}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {user.username || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-brand-green text-xs">
                          {shortenAddress(user.wallet_address, 8)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            user.is_verified 
                              ? 'bg-brand-green/10 text-brand-green border-brand-green/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-400/20'
                          }`}>
                            {user.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {user.is_verified && (
                              <span className="flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded">
                                <CheckCircle size={10} className="fill-current" />
                                Green
                              </span>
                            )}
                            {user.is_official_verified && (
                              <span className="flex items-center gap-1 text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">
                                <YellowTick size="sm" />
                                Official
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleOfficialVerified(user.id, user.is_official_verified)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
                              user.is_official_verified
                                ? 'bg-red-500/10 text-red-400 border border-red-400/20 hover:bg-red-500/20'
                                : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20'
                            }`}
                          >
                            {user.is_official_verified ? (
                              <>
                                <XCircle size={14} /> Remove Official
                              </>
                            ) : (
                              <>
                                <Crown size={14} /> Make Official
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl">
            <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
              <Crown size={16} /> How Official Verification Works
            </h3>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Only Admin can grant/remove Official (Yellow) verification</li>
              <li>Yellow tick appears on all missions by that brand</li>
              <li>Use this for brands with subscription/paid plans</li>
              <li>Green tick = Approved brand, Yellow tick = Official/Premium brand</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}
