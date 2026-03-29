'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useMissions } from '@/hooks/use-missions'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AdminMissions() {
  const { missions, loading, refetch } = useMissions()
  
  // @ts-ignore - Supabase type issue
  const approve = async (id: string) => { 
    await supabase.from('missions').update({ status: 'active' }).eq('id', id)
    refetch()
    toast.success('Approved!') 
  }
  
  // @ts-ignore - Supabase type issue
  const reject = async (id: string) => { 
    await supabase.from('missions').update({ status: 'cancelled' }).eq('id', id)
    refetch()
    toast.success('Rejected') 
  }
  
  return (
    <div className="min-h-screen bg-brand-dark"><Navbar />
    <div className="flex pt-16"><Sidebar />
    <main className="flex-1 p-6 lg:p-8">
      <h1 className="text-3xl font-black mb-8">Manage <span className="text-brand-purple">Missions</span></h1>
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-gray-500">Loading...</div> : (
        <table className="w-full text-sm">
          <thead className="border-b border-brand-border"><tr>{['Title','Pool','Status','Deadline','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>)}</tr></thead>
          <tbody>{missions.map(m => (
            <tr key={m.id} className="border-b border-brand-border/40">
              <td className="px-4 py-3 font-medium text-white max-w-xs truncate">{m.title}</td>
              <td className="px-4 py-3 text-brand-green font-bold">{m.reward_pool} {m.currency}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${m.status==='active'?'bg-brand-green/10 text-brand-green border-brand-green/20':'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'}`}>{m.status}</span></td>
              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.deadline).toLocaleDateString()}</td>
              <td className="px-4 py-3"><div className="flex gap-2">{m.status==='draft'&&<><button onClick={()=>approve(m.id)} className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold">✅ Approve</button><button onClick={()=>reject(m.id)} className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold">❌ Reject</button></>}</div></td>
            </tr>
          ))}</tbody>
        </table>)}
      </div>
    </main></div></div>
  )
}
