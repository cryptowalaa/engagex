'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Trophy } from 'lucide-react'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'
import type { User } from '@/types/database'

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('weekly')
  useEffect(() => {
    supabase.from('users').select('*').order('total_earned',{ascending:false}).limit(50).then(({data})=>{setUsers(data||[]);setLoading(false)})
  }, [period])
  return (
    <div className="min-h-screen bg-brand-dark"><Navbar />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black mb-3">Creator <span className="text-brand-green">Leaderboard</span></h1>
        <p className="text-gray-400">Top earners · Updated in real-time</p>
      </div>
      <div className="flex justify-center gap-3 mb-10">
        {['weekly','monthly','alltime'].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${period===p?'bg-brand-green text-brand-dark':'bg-brand-card border border-brand-border text-gray-400'}`}>
            {p==='alltime'?'All Time':p}
          </button>
        ))}
      </div>
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        {loading?<div className="p-10 text-center text-gray-500">Loading...</div>:users.length===0?(
          <div className="p-10 text-center"><Trophy size={40} className="text-gray-700 mx-auto mb-3"/><p className="text-gray-400">No data yet!</p></div>
        ):(
          <table className="w-full text-sm">
            <thead className="border-b border-brand-border"><tr>{['Rank','Wallet','Role','Earned'].map(h=><th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{users.map((user,i)=>(
              <tr key={user.id} className="border-b border-brand-border/40 hover:bg-white/2 transition-colors">
                <td className="px-5 py-4"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${i===0?'bg-yellow-400/15 text-yellow-400':i===1?'bg-gray-400/15 text-gray-400':i===2?'bg-orange-400/15 text-orange-400':'bg-brand-border text-gray-500'}`}>{i+1}</div></td>
                <td className="px-5 py-4 font-mono text-brand-green text-xs">{shortenAddress(user.wallet_address,6)}</td>
                <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${user.role==='admin'?'bg-brand-purple/10 text-brand-purple border-brand-purple/20':user.role==='creator'?'bg-brand-green/10 text-brand-green border-brand-green/20':'bg-blue-500/10 text-blue-400 border-blue-400/20'}`}>{user.role}</span></td>
                <td className="px-5 py-4 font-black text-brand-green">{formatUSDC(user.total_earned)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
    <Footer /></div>
  )
}
