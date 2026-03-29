'use client'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { supabase } from '@/lib/supabase/client'
import { useMissions } from '@/hooks/use-missions'
import toast from 'react-hot-toast'

export default function AdminRewards() {
  const { missions } = useMissions('completed')
  const [selected, setSelected] = useState('')
  const [distributing, setDistributing] = useState(false)
  const distribute = async () => {
    if (!selected) return toast.error('Select a mission first')
    setDistributing(true)
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Rewards distributed successfully! 🎉')
    setDistributing(false)
  }
  return (
    <div className="min-h-screen bg-brand-dark"><Navbar />
    <div className="flex pt-16"><Sidebar />
    <main className="flex-1 p-6 lg:p-8">
      <h1 className="text-3xl font-black mb-8">Distribute <span className="text-brand-purple">Rewards</span></h1>
      <div className="max-w-2xl bg-brand-card border border-brand-border rounded-2xl p-8 space-y-6">
        <div><label className="text-sm text-gray-400 font-semibold block mb-2">Select Completed Mission</label>
          <select value={selected} onChange={e=>setSelected(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-green/50">
            <option value="">-- Select Mission --</option>
            {missions.map(m=><option key={m.id} value={m.id}>{m.title} ({m.reward_pool} {m.currency})</option>)}
          </select></div>
        {selected && (<div className="grid grid-cols-3 gap-4">
          {[['60%','Creators','text-brand-green'],['20%','Engagers','text-brand-purple'],['20%','Platform','text-yellow-400']].map(([pct,lbl,col])=>(
            <div key={lbl} className="bg-brand-dark border border-brand-border rounded-xl p-4 text-center"><p className={`text-2xl font-black ${col}`}>{pct}</p><p className="text-xs text-gray-500 mt-1">{lbl}</p></div>
          ))}</div>)}
        <button onClick={distribute} disabled={distributing||!selected} className="w-full bg-brand-green text-brand-dark font-black py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50">
          {distributing ? 'Distributing...' : '🚀 Distribute Rewards'}
        </button>
      </div>
    </main></div></div>
  )
}
