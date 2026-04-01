'use client'
import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Target, Plus, ImageIcon, Shield, CheckCircle, Sparkles, Loader2, Crown, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { MISSION_CATEGORIES } from '@/lib/config'
import { PublicKey, Transaction } from '@solana/web3.js'
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

// Mainnet USDC Mint
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
// Treasury Wallet
const TREASURY_WALLET = new PublicKey('A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP')
// Badge Price: 29 USDC (6 decimals)
const BADGE_PRICE = 29 * 10**6

interface BadgeOption {
  type: 'blue' | 'gold'
  name: string
  price: number
  duration: string
  features: string[]
  icon: any
  gradient: string
  shadow: string
}

const BADGES: BadgeOption[] = [
  {
    type: 'blue',
    name: 'Verified Brand',
    price: 29,
    duration: '1 Year',
    features: [
      'Trust & Credibility Badge',
      'Priority Mission Listing',
      'Verified Profile Badge',
      'Community Trust Score',
      'Premium Support Access'
    ],
    icon: Shield,
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
    shadow: 'shadow-blue-500/20'
  },
  {
    type: 'gold',
    name: 'Official Brand',
    price: 29,
    duration: '1 Year',
    features: [
      'Everything in Verified',
      'Gold Badge on Profile',
      'Featured in Leaderboard',
      'Early Access to Features',
      'Direct Admin Support',
      'Marketing Boost Priority'
    ],
    icon: Crown,
    gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
    shadow: 'shadow-yellow-500/20'
  }
]

export default function CreateMission() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [badgeLoading, setBadgeLoading] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<'blue' | 'gold' | null>(null)
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

  const purchaseBadge = async (badgeType: 'blue' | 'gold') => {
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
          badge_type: badgeType,
          badge_purchased_at: new Date().toISOString(),
          badge_payment_tx: signature,
          is_verified: true,
          role: 'brand'
        })
        .eq('id', user.id)

      await (supabase.from('badge_payments') as any)
        .insert({
          user_id: user.id,
          badge_type: badgeType,
          amount: 29.00,
          currency: 'USDC',
          transaction_signature: signature,
          treasury_wallet: TREASURY_WALLET.toBase58(),
          status: 'completed'
        })

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🎉 {badgeType === 'gold' ? 'Official' : 'Verified'} Brand Badge Active!</span>
          <span className="text-xs">Transaction: {signature.slice(0, 20)}...</span>
        </div>,
        { id: toastId, duration: 5000 }
      )
      
      setUserBadge(badgeType)
      setSelectedBadge(null)

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
    
    if (!userBadge) {
      toast.error('Please purchase a Verified Brand badge first!')
      return
    }

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

  const BadgeSection = () => {
    if (checkingBadge) {
      return (
        <div className="mb-8 p-6 bg-brand-card border border-brand-border rounded-2xl">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span>Checking verification status...</span>
          </div>
        </div>
      )
    }

    if (userBadge && userBadge !== 'admin') {
      const isGold = userBadge === 'gold'
      return (
        <div className={`mb-8 p-6 rounded-2xl border ${
          isGold 
            ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30' 
            : 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isGold ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            }`}>
              {isGold ? <Crown size={32} className="text-yellow-400" /> : <Shield size={32} className="text-blue-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={`text-xl font-bold ${isGold ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {isGold ? '⭐ Official Brand' : '✓ Verified Brand'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-green/20 text-brand-green border border-brand-green/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-gray-400 text-sm">You have full access to create missions and manage campaigns</p>
            </div>
          </div>
        </div>
      )
    }

    if (userBadge === 'admin') {
      return (
        <div className="mb-8 p-6 rounded-2xl border bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-purple-500/20">
              <Star size={32} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-400">Admin Access</h3>
              <p className="text-gray-400 text-sm">Unlimited mission creation enabled</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="mb-8 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="text-brand-green" size={24} />
            Upgrade to Verified Brand
          </h3>
          <p className="text-gray-400 max-w-lg mx-auto">
            Purchase a verification badge to unlock mission creation and build trust with creators. 
            One-time payment of <span className="text-brand-green font-bold">$29 USDC</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BADGES.map((badge) => {
            const Icon = badge.icon
            const isSelected = selectedBadge === badge.type
            
            return (
              <div 
                key={badge.type}
                onClick={() => setSelectedBadge(badge.type)}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
                  isSelected
                    ? `border-brand-green bg-brand-green/5 ${badge.shadow}`
                    : 'border-brand-border bg-brand-card hover:border-gray-600 hover:scale-[1.02]'
                }`}
              >
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${badge.gradient} flex items-center justify-center shadow-lg ${badge.shadow}`}>
                  <Icon size={32} className="text-white" />
                </div>
                
                <div className="mb-6 pt-4">
                  <h4 className="text-2xl font-bold text-white mb-2">{badge.name}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-brand-green">${badge.price}</span>
                    <span className="text-gray-500">/ {badge.duration}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {badge.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-center gap-3">
                      <CheckCircle size={16} className={badge.type === 'gold' ? 'text-yellow-400 flex-shrink-0' : 'text-blue-400 flex-shrink-0'} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      purchaseBadge(badge.type)
                    }}
                    disabled={badgeLoading}
                    className={`w-full bg-gradient-to-r ${badge.gradient} text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg ${badge.shadow}`}
                  >
                    {badgeLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Purchase {badge.name}
                      </>
                    )}
                  </button>
                )}

                {!isSelected && (
                  <div className="w-full py-4 rounded-xl border border-dashed border-gray-600 text-gray-500 text-center text-sm font-medium">
                    Click to select
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="bg-brand-dark/50 border border-brand-border rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-brand-green mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">Secure Payment via Solana</p>
              <p>• Single transaction - No recurring fees</p>
              <p>• Funds sent directly to treasury wallet</p>
              <p>• Badge activates instantly after confirmation</p>
              <p>• No Phantom warnings - Clean transaction</p>
            </div>
          </div>
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
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                <Target size={32} className="text-brand-green" />
                Create <span className="text-brand-green">Mission</span>
              </h1>
              <p className="text-gray-400">Launch an attention campaign with a reward pool</p>
            </div>
            
            <div className="bg-brand-card border border-brand-border rounded-2xl p-8 space-y-6">
              
              <BadgeSection />

              <div className="border-t border-brand-border pt-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={18} className="text-brand-green" />
                  Mission Details
                </h4>

                <div className="space-y-5">
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
                      <div className="mt-3 p-3 bg-brand-dark rounded-xl border border-brand-border">
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
                  
                  <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-4 text-sm text-gray-400">
                    <p className="text-brand-green font-semibold mb-1">📋 Mission Flow</p>
                    <p>Mission starts as <strong>draft</strong>. Admin approves → send funds to treasury → becomes <strong>active</strong>. Winners paid at deadline.</p>
                  </div>
                  
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading || !userBadge}
                    className={`w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all text-lg ${
                      userBadge 
                        ? 'bg-brand-green text-brand-dark hover:bg-opacity-90 hover:shadow-[0_0_25px_rgba(0,255,136,0.4)]' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={20} />
                    {loading ? 'Creating...' : !userBadge ? 'Purchase Badge First' : 'Create Mission'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
