'use client'
import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Target, Plus, ImageIcon, Check, Sparkles, Loader2, Star, Wallet, ArrowRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { MISSION_CATEGORIES } from '@/lib/config'
import { PublicKey, Transaction } from '@solana/web3.js'
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

// Mainnet USDC Mint
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
// Treasury Wallet
const TREASURY_WALLET = new PublicKey('A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP')

const BADGE_FEATURES = [
  'Trust & Credibility Badge',
  'Priority Mission Listing', 
  'Verified Profile Badge',
  'Community Trust Score',
  'Premium Support Access',
  'Featured in Leaderboard',
  'Early Access to Features'
]

// Badge Icon - Yellow rounded square with checkmark
const BadgeIcon = ({ size = 80 }: { size?: number }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-2xl blur-lg opacity-50" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)' }}></div>
    <div className="relative w-full h-full rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)', boxShadow: '0 10px 40px -10px rgba(245, 158, 11, 0.5)' }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-10deg)' }}>
        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  </div>
)

const SmallBadgeIcon = () => (
  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md ml-1" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-10deg)' }}>
      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
)

export default function CreateMission() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [badgeLoading, setBadgeLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [userBadge, setUserBadge] = useState<string | null>(null)
  const [checkingBadge, setCheckingBadge] = useState(true)
  const [createdMission, setCreatedMission] = useState<any>(null)
  const [showPayment, setShowPayment] = useState(false)
  
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
      const { data: user } = await (supabase.from('users') as any)
        .select('badge_type, role')
        .eq('wallet_address', publicKey?.toBase58())
        .single()
      
      if (user?.badge_type) setUserBadge(user.badge_type)
      else if (user?.role === 'admin') setUserBadge('admin')
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
        instructions.push(createAssociatedTokenAccountInstruction(publicKey, treasuryTokenAccount, TREASURY_WALLET, USDC_MINT))
      }

      instructions.push(createTransferInstruction(userTokenAccount, treasuryTokenAccount, publicKey, 29 * 10**6))

      const transaction = new Transaction()
      instructions.forEach(ix => transaction.add(ix))
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signed = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' })
      await connection.confirmTransaction(signature, 'confirmed')

      let { data: user } = await (supabase.from('users') as any).select('*').eq('wallet_address', publicKey.toBase58()).single()
      if (!user) {
        const { data: newUser } = await (supabase.from('users') as any)
          .insert({ wallet_address: publicKey.toBase58(), role: 'brand', username: `brand_${publicKey.toBase58().slice(0, 6)}` })
          .select().single()
        user = newUser
      }

      await (supabase.from('users') as any)
        .update({ badge_type: 'gold', badge_purchased_at: new Date().toISOString(), badge_payment_tx: signature, is_verified: true, role: 'brand' })
        .eq('id', user.id)

      await (supabase.from('badge_payments') as any)
        .insert({ user_id: user.id, badge_type: 'gold', amount: 29.00, currency: 'USDC', transaction_signature: signature, treasury_wallet: TREASURY_WALLET.toBase58(), status: 'completed' })

      toast.success(<div className="flex flex-col gap-1"><span className="font-bold">🎉 Official Brand Badge Active!</span><span className="text-xs">Funds sent to treasury</span></div>, { id: toastId, duration: 5000 })
      setUserBadge('gold')
    } catch (error: any) {
      toast.error(error.message || 'Payment failed.', { id: toastId })
    } finally {
      setBadgeLoading(false)
    }
  }

  // STEP 1: Create Mission (Draft)
  const handleCreateMission = async () => {
    if (!publicKey) return toast.error('Connect wallet first')
    if (!form.title || !form.description || !form.reward_pool || !form.deadline)
      return toast.error('Fill all required fields')

    setLoading(true)
    try {
      let { data: userData } = await (supabase.from('users') as any).select('*').eq('wallet_address', publicKey.toBase58()).single()
      if (!userData) {
        const { data: newUser } = await (supabase.from('users') as any)
          .insert({ wallet_address: publicKey.toBase58(), role: 'brand', username: `brand_${publicKey.toBase58().slice(0, 6)}` })
          .select().single()
        userData = newUser
      }

      const { data: mission, error } = await (supabase.from('missions') as any)
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
          status: 'draft_pending_payment', // NEW STATUS
          payment_status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      
      setCreatedMission(mission)
      setShowPayment(true)
      toast.success('Mission created! Pay reward pool to activate.', { duration: 5000 })
    } catch (e: any) { 
      toast.error(e.message || 'Failed') 
    } finally { 
      setLoading(false) 
    }
  }

  // STEP 2: Pay Reward Pool
  const payRewardPool = async () => {
    if (!publicKey || !signTransaction || !createdMission) return

    const amount = parseFloat(form.reward_pool)
    const decimals = form.currency === 'USDC' ? 6 : 9
    const amountInLamports = Math.floor(amount * 10**decimals)

    setPaymentLoading(true)
    const toastId = toast.loading(`Paying ${amount} ${form.currency} to treasury...`)

    try {
      if (form.currency === 'USDC') {
        // USDC SPL Token Transfer
        const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey)
        const treasuryTokenAccount = await getAssociatedTokenAddress(USDC_MINT, TREASURY_WALLET)
        
        const instructions = []
        const treasuryAccountInfo = await connection.getAccountInfo(treasuryTokenAccount)
        if (!treasuryAccountInfo) {
          instructions.push(createAssociatedTokenAccountInstruction(publicKey, treasuryTokenAccount, TREASURY_WALLET, USDC_MINT))
        }

        instructions.push(createTransferInstruction(userTokenAccount, treasuryTokenAccount, publicKey, amountInLamports))

        const transaction = new Transaction()
        instructions.forEach(ix => transaction.add(ix))
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signed = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' })
        await connection.confirmTransaction(signature, 'confirmed')

        // Update mission with payment info
        await (supabase.from('missions') as any)
          .update({
            status: 'draft',
            payment_status: 'completed',
            payment_tx: signature,
            paid_at: new Date().toISOString()
          })
          .eq('id', createdMission.id)

        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">✅ Payment Successful!</span>
            <span className="text-xs">Mission sent for admin approval</span>
          </div>,
          { id: toastId, duration: 5000 }
        )

      } else {
        // SOL Transfer (Native)
        const { SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: TREASURY_WALLET,
            lamports: amountInLamports
          })
        )

        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signed = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(signature, 'confirmed')

        await (supabase.from('missions') as any)
          .update({
            status: 'draft',
            payment_status: 'completed',
            payment_tx: signature,
            paid_at: new Date().toISOString()
          })
          .eq('id', createdMission.id)

        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">✅ Payment Successful!</span>
            <span className="text-xs">Mission sent for admin approval</span>
          </div>,
          { id: toastId, duration: 5000 }
        )
      }

      // Redirect to missions page
      setTimeout(() => {
        router.push('/brand/missions')
      }, 2000)

    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Payment failed. Please try again.', { id: toastId })
    } finally {
      setPaymentLoading(false)
    }
  }

  // Payment Screen
  const PaymentScreen = () => (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-8 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Mission in Draft</h2>
        <p className="text-gray-400">Your mission has been created successfully!</p>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-sm text-yellow-400 text-center">
          <strong>To activate your mission:</strong> Pay the reward pool amount to treasury. 
          Once paid, admin will review and activate your mission.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-[#30363d]">
          <span className="text-gray-400">Mission</span>
          <span className="text-white font-medium">{createdMission?.title}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-[#30363d]">
          <span className="text-gray-400">Reward Pool</span>
          <span className="text-brand-green font-bold text-xl">{form.reward_pool} {form.currency}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-[#30363d]">
          <span className="text-gray-400">Treasury Wallet</span>
          <span className="text-gray-500 font-mono text-xs">{TREASURY_WALLET.toBase58().slice(0, 20)}...</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-gray-400">Status</span>
          <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            ⏳ Pending Payment
          </span>
        </div>
      </div>

      <div className="bg-[#00d084]/5 border border-[#00d084]/20 rounded-xl p-4 text-sm text-gray-400">
        <p className="text-[#00d084] font-semibold mb-2">💡 How it works:</p>
        <ul className="space-y-1 text-xs">
          <li>1. Pay reward pool amount now (single transaction)</li>
          <li>2. Admin reviews your mission and payment</li>
          <li>3. Mission goes live for creators to participate</li>
          <li>4. Winners get paid automatically at deadline</li>
        </ul>
      </div>

      <button 
        onClick={payRewardPool}
        disabled={paymentLoading}
        className="w-full bg-[#00d084] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 hover:shadow-[0_0_25px_rgba(0,208,132,0.4)] transition-all disabled:opacity-50 text-lg"
      >
        {paymentLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Wallet size={20} />
            Pay {form.reward_pool} {form.currency} Now
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Single transaction • No additional fees • Funds go directly to treasury
      </p>
    </div>
  )

  // Badge Box Component
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
          <div className="flex justify-center mb-4">
            <BadgeIcon size={80} />
          </div>
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center">
              Official Brand
              <SmallBadgeIcon />
            </h3>
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
            <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Star size={40} className="text-purple-400" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-purple-400">Admin Access</h3>
            <p className="text-xs text-gray-400">Unlimited</p>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 h-fit">
        <div className="flex justify-center mb-4">
          <BadgeIcon size={80} />
        </div>
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center">
            Official Brand
            <SmallBadgeIcon />
          </h3>
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
          className="w-full bg-gradient-to-r from-[#fbbf24] to-[#ea580c] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20"
        >
          {badgeLoading ? (
            <><Loader2 size={18} className="animate-spin" />Processing...</>
          ) : (
            <><Sparkles size={18} />Purchase Badge</>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-4">Optional • Secure payment via Solana</p>
      </div>
    )
  }

  // Show Payment Screen if mission created
  if (showPayment && createdMission) {
    return (
      <div className="min-h-screen bg-[#0a0f1c]">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <PaymentScreen />
            </div>
          </main>
        </div>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-8 space-y-5">
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2 flex items-center gap-2">
                      <ImageIcon size={14} /> Mission Image URL
                    </label>
                    <input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://example.com/image.jpg" className={INPUT} />
                    {form.image_url && (
                      <div className="mt-3 p-3 bg-[#0a0f1c] rounded-xl border border-[#30363d]">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <img src={form.image_url} alt="Mission preview" className="w-full h-32 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Mission Title *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Twitter Thread Campaign — Jupiter DEX" className={INPUT} />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Description *</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="What creators need to do..." className={`${INPUT} resize-none`} />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Requirements</label>
                    <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={2} placeholder="Min tweet count, required hashtags..." className={`${INPUT} resize-none`} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Reward Pool *</label>
                      <input type="number" value={form.reward_pool} onChange={e => set('reward_pool', e.target.value)} placeholder="500" className={INPUT} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Currency</label>
                      <select value={form.currency} onChange={e => set('currency', e.target.value)} className={INPUT}>
                        <option>USDC</option>
                        <option>SOL</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Deadline *</label>
                      <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 font-semibold block mb-2">Max Winners</label>
                      <input type="number" value={form.max_winners} onChange={e => set('max_winners', e.target.value)} className={INPUT} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 font-semibold block mb-2">Category</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={INPUT}>
                      {MISSION_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="bg-[#00d084]/5 border border-[#00d084]/20 rounded-xl p-4 text-sm text-gray-400">
                    <p className="text-[#00d084] font-semibold mb-1">📋 New Mission Flow:</p>
                    <p>1. Create mission → 2. Pay reward pool → 3. Admin approves → 4. Mission goes live</p>
                  </div>
                  
                  <button onClick={handleCreateMission} disabled={loading} className="w-full bg-[#00d084] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 hover:shadow-[0_0_25px_rgba(0,208,132,0.4)] transition-all disabled:opacity-50 text-lg">
                    <Plus size={20} />
                    {loading ? 'Creating...' : 'Create Mission'}
                  </button>
                </div>
              </div>

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
