'use client'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Target, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { MISSION_CATEGORIES } from '@/lib/config'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

export default function CreateMission() {
  const { publicKey } = useWallet()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', requirements: '',
    reward_pool: '', currency: 'USDC', deadline: '',
    max_winners: '10', category: 'Social Media',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!publicKey) return toast.error('Connect wallet first')
    if (!form.title || !form.description || !form.reward_pool || !form.deadline)
      return toast.error('Fill all required fields')
    setLoading(true)
    try {
      // @ts-ignore - Supabase type issue
      const { data: user } = await supabase
        .from('users')
        .upsert({ wallet_address: publicKey.toBase58(), role: 'brand' }, { onConflict: 'wallet_address' })
        .select().single()
      
      // @ts-ignore - Supabase type issue
      const { error } = await supabase.from('missions').insert({
        brand_id: user?.id,
        title: form.title, description: form.description,
        requirements: form.requirements,
        reward_pool: parseFloat(form.reward_pool),
        currency: form.currency,
        deadline: new Date(form.deadline).toISOString(),
        max_winners: parseInt(form.max_winners),
        category: form.category, status: 'draft',
      })
      if (error) throw error
      toast.success('Mission created! Waiting for admin approval 🎉')
      router.push('/brand/missions')
    } catch (e: any) { toast.error(e.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
              <Target size={28} className="text-brand-green" />
              Create <span className="text-brand-green">Mission</span>
            </h1>
            <p className="text-gray-400 mb-8">Launch an attention campaign with a reward pool</p>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-8 space-y-5">
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
                    <option>USDC</option><option>SOL</option>
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
              <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-4 text-sm text-gray-400">
                <p className="text-brand-green font-semibold mb-1">📋 Mission Flow</p>
                <p>Mission starts as <strong>draft</strong>. Admin approves → send funds to treasury → becomes <strong>active</strong>. Winners paid at deadline.</p>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-brand-green text-brand-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50 text-lg">
                <Plus size={20} />{loading ? 'Creating...' : 'Create Mission'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
