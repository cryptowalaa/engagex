'use client'
import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Target, Plus, ImageIcon, Settings, Check, Sparkles, Loader2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { MISSION_CATEGORIES } from '@/lib/config'
import { PublicKey, Transaction } from '@solana/web3.js'
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

// Mainnet USDC Mint
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
// Treasury Wallet - Your Address
const TREASURY_WALLET = new PublicKey('A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP')
// Badge Price: 29 USDC (6 decimals)
const BADGE_PRICE = 29 * 10**6

const BADGE_FEATURES = [
  'Trust & Credibility Badge',
  'Priority Mission Listing', 
  'Verified Profile Badge',
  'Community Trust Score',
  'Premium Support Access',
  'Featured in Leaderboard',
  'Early Access to Features'
]

export default function CreateMission() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [badgeLoading, setBadgeLoading] = useState(false)
  const [userBadge, setUserBadge] = useState<string | null>(null)
  const [checkingBadge, setCheckingBadge] = useState(true)
  
  const [form, setForm] = useState({
    title: '', description: '', requirements: '',
    reward_pool: '', currency: 'USDC', deadline: '',
    max_winners: '10', category: 'Social Media',
    image_url: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (publicKey) checkUserBadge()
  }, [publicKey])

  const checkUserBadge = async () => {
    setCheckingBadge(true)
    try {
      const { data: user } = await (supabase
        .from('users') as any)
        .select('badge_type, role')
        .eq('wallet_address', publicKey?.toBase58())
        .single()
      
      if (user?.badge_type) {
        setUserBadge(user.badge_type)
      } else if (user?.role === 'admin') {
        setUserBadge('admin')
      }
    } catch (e) {
      console.log('No user found')
    } finally {
      setCheckingBadge(false)
    }
  }

  const purchaseBadge = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }

    setBadgeLoading(true)
    const toastId = toast.loading('Processing $29 USDC payment...')

    try {
      const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey)
      const treasuryTokenAccount = await getAssociatedTokenAddress(USDC_MINT, TREASURY_WALLET)

      const userAccountInfo = await connection.getAccountInfo(userTokenAccount)
      
      if (!userAccountInfo) {
        toast.error('Insufficient USDC balance. You need 29 USDC + small fee.', { id: toastId })
        setBadgeLoading(false)
        return
      }

      const instructions = []

      const treasuryAccountInfo = await connection.getAccountInfo(treasuryTokenAccount)
      if (!treasuryAccountInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryTokenAccount,
            TREASURY_WALLET,
            USDC_MINT
          )
        )
      }

      instructions.push(
        createTransferInstruction(
          userTokenAccount,
          treasuryTokenAccount,
          publicKey,
          BADGE_PRICE
        )
      )

      const transaction = new Transaction()
      instructions.forEach(ix => transaction.add(ix))
      
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signed = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      })
      
      await connection.confirmTransaction(signature, 'confirmed')

      let { data: user } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single()

      if (!user) {
        const { data: newUser } = await (supabase
          .from('users') as any)
          .insert({
            wallet_address: publicKey.toBase58(),
            role: 'brand',
            username: `brand_${publicKey.toBase58().slice(0, 6)}`
          })
          .select()
          .single()
        user = newUser
      }

      await (supabase.from('users') as any)
        .update({
          badge_type: 'gold',
          badge_purchased_at: new Date().toISOString(),
          badge_payment_tx: signature,
          is_verified: true,
          role: 'brand'
        })
        .eq('id', user.id)

      await (supabase.from('badge_payments') as any)
        .insert({
          user_id: user.id,
          badge_type: 'gold',
          amount: 29.00,
          currency: 'USDC',
          transaction_signature: signature,
          treasury_wallet: TREASURY_WALLET.toBase58(),
          status: 'completed'
        })

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🎉 Official Brand Badge Active!</span>
          <span className="text-xs">Funds sent to treasury</span>
        </div>,
        { id: toastId, duration: 5000 }
      )
      
      setUserBadge('gold')

    } catch (error: any) {
      console.error('Badge purchase error:', error)
      toast.error(error.message || 'Payment failed. Please try again.', { id: toastId })
    } finally {
      setBadgeLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!publicKey) return toast.error('Connect wallet first')
    if (!form.title || !form.description || !form.reward_pool || !form.deadline)
      return toast.error('Fill all required fields')

    setLoading(true)
    try {
      let { data: userData } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single()

      if (!userData) {
        const { data: newUser } = await (supabase
          .from('users') as any)
          .insert({
            wallet_address: publicKey.toBase58(),
            role: 'brand',
            username: `brand_${publicKey.toBase58().slice(0, 6)}`
          })
          .select()
          .single()
        userData = newUser
      }

      if (!userData || !userData.id) {
        toast.error('Failed to get user')
        setLoading(false)
        return
      }
      
      const { error } = await (supabase
        .from('missions') as any)
        .insert({
          brand_id: userData.id,
          title: form.title,
          description: form.description,
          requirements: form.requirements,
          reward_pool: parseFloat(form.reward_pool),
          currency: form.currency,
          deadline: new Date(form.deadline).toISOString(),
          max_winners: parseInt(form.max_winners),
          category: form.category, 
          image_url: form.image_url || null,
          status: 'draft',
        })
      
      if (error) throw error
      toast.success('Mission created! Waiting for admin approval 🎉')
      router.push('/brand/missions')
    } catch (e: any) { 
      toast.error(e.message || 'Failed') 
    } finally { 
      setLoading(false) 
    }
  }

  // EXACT Badge Box like screenshot - Rounded square with gear icon
  const BadgeBox = () => {
    if (checkingBadge) {
      return (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 h-fit">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span>Checking...</span>
          </div>
        </div>
      )
    }

    if (userBadge && userBadge !== 'admin') {
      return (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 h-fit">
          {/* EXACT Icon - Rounded square with gear */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbf24] via-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Settings size={32} className="text-white" strokeWidth={2} />
            </div>
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white mb-1">Official Brand</h3>
            <p className="text-xs text-gray-400">1 Year Access • Active</p>
          </div>

          <div className="space-y-3 mb-4">
            {BADGE_FEATURES.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-gray-300">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-green-400" />
                </div>
                {feature}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#30363d] text-center">
            <span className="text-xs text-green-400 font-medium">✓ Badge Active</span>
          </div>
        </div>
      )
    }

    if (userBadge === 'admin') {
      return (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 h-fit">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Star size={32} className="text-purple-400" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-purple-400">Admin Access</h3>
            <p className="text-xs text-gray-400">Unlimited</p>
          </div>
        </div>
      )
    }

    // NOT PURCHASED - Show Purchase Box (EXACT like screenshot)
    return (
      <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 h-fit">
        {/* EXACT Icon - Rounded square yellow with gear */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fbbf24] via-[#f59e0b] to-[#d97706] flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Settings size={40} className="text-white" strokeWidth={2} />
          </div>
        </div>

        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-white mb-1">Official Brand</h3>
          <p className="text-xs text-gray-400">1 Year Access • Optional</p>
        </div>

        <div className="text-center mb-6">
          <span className="text-4xl font-black text-[#00d084]">$29</span>
          <span className="text-gray-500 text-sm ml-1">USDC</span>
        </div>

        <div className="space-y-3 mb-6">
          {BADGE_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-green-400" />
              </div>
              {feature}
            </div>
          ))}
        </div>

        <button
          onClick={purchaseBadge}
          disabled={badgeLoading}
          className="w-full bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20"
        >
          {badgeLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Purchase Badge
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Optional • Secure payment via Solana
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2 flex items-center gap-3 text-white">
                <Target size={32} className="text-[#00d084]" />
                Create <span className="text-[#00d084]">Mission</span>
              </h1>
              <p className="text-gray-400">Launch an attention campaign with a reward pool</p>
            </div>
            
            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN - Original Form */}
              <div className="lg:col-span-2">
                <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-8 space-y-5">
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2 flex items-center gap-2">
                      <ImageIcon size={14} /> Mission Image URL
                    </label>
                    <input 
                      value={form.image_url} 
                      onChange={e => set('image_url', e.target.value)} 
                      placeholder="https://example.com/image.jpg" 
                      className={INPUT} 
                    />
                    {form.image_url && (
                      <div className="mt-3 p-3 bg-[#0a0f1c] rounded-xl border border-[#30363d]">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <img 
                          src={form.image_url} 
                          alt="Mission preview" 
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Mission Title *</label>
                    <input 
                      value={form.title} 
                      onChange={e => set('title', e.target.value)} 
                      placeholder="e.g. Twitter Thread Campaign — Jupiter DEX" 
                      className={INPUT} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Description *</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => set('description', e.target.value)} 
                      rows={4} 
                      placeholder="What creators need to do..." 
                      className={`${INPUT} resize-none`} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Requirements</label>
                    <textarea 
                      value={form.requirements} 
                      onChange={e => set('requirements', e.target.value)} 
                      rows={2} 
                      placeholder="Min tweet count, required hashtags..." 
                      className={`${INPUT} resize-none`} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Reward Pool *</label>
                      <input 
                        type="number" 
                        value={form.reward_pool} 
                        onChange={e => set('reward_pool', e.target.value)} 
                        placeholder="500" 
                        className={INPUT} 
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Currency</label>
                      <select 
                        value={form.currency} 
                        onChange={e => set('currency', e.target.value)} 
                        className={INPUT}
                      >
                        <option>USDC</option>
                        <option>SOL</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Deadline *</label>
                      <input 
                        type="datetime-local" 
                        value={form.deadline} 
                        onChange={e => set('deadline', e.target.value)} 
                        className={INPUT} 
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Max Winners</label>
                      <input 
                        type="number" 
                        value={form.max_winners} 
                        onChange={e => set('max_winners', e.target.value)} 
                        className={INPUT} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Category</label>
                    <select 
                      value={form.category} 
                      onChange={e => set('category', e.target.value)} 
                      className={INPUT}
                    >
                      {MISSION_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="bg-[#00d084]/5 border border-[#00d084]/20 rounded-xl p-4 text-sm text-gray-400">
                    <p className="text-[#00d084] font-semibold mb-1">📋 Mission Flow</p>
                    <p>Mission starts as <strong>draft</strong>. Admin approves → send funds to treasury → becomes <strong>active</strong>. Winners paid at deadline.</p>
                  </div>
                  
                  {/* BUTTON - Always enabled, badge is OPTIONAL */}
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full bg-[#00d084] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 hover:shadow-[0_0_25px_rgba(0,208,132,0.4)] transition-all disabled:opacity-50 text-lg"
                  >
                    <Plus size={20} />
                    {loading ? 'Creating...' : 'Create Mission'}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN - Yellow Badge Box (Exact like screenshot) */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <BadgeBox />
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
