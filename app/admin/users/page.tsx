'use client'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { supabase } from '@/lib/supabase/client'
import { shortenAddress, formatUSDC } from '@/lib/utils/helpers'
import type { User } from '@/types/database'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { supabase.from('users').select('*').order('created_at',{ascending:false}).then(({data})=>{setUsers(data||[]);setLoading(false)}) }, [])
  
  const setRole = async (id: string, role: string) => { 
    // @ts-ignore
    await supabase.from('users').update({role}).eq('id',id)
    setUsers(u=>u.map(x=>x.id===id?{...x,role:role as any}:x))
    toast.success('Role updated!') 
  }
  
  return (
    <div className="min-h-screen bg-brand-dark"><Navbar />
    <div className="flex pt-16"><Sidebar />
    <main className="flex-1 p-6 lg:p-8">
      <h1 className="text-3xl font-black mb-8">Manage <span className="text-brand-purple">Users</span></h1>
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-gray-500">Loading...</div> : (
        <table className="w-full text-sm">
          <thead className="border-b border-brand-border"><tr>{['Wallet','Role','Earned','Joined','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>)}</tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} className="border-b border-brand-border/40 hover:bg-white/2">
              <td className="px-4 py-3 font-mono text-brand-green text-xs">{shortenAddress(u.wallet_address,8)}</td>
              <td className="px-4 py-3"><select value={u.role} onChange={e=>setRole(u.id,e.target.value)} className="bg-brand-dark border border-brand-border rounded-lg px-2 py-1 text-xs text-white"><option value="user">user</option><option value="creator">creator</option><option value="brand">brand</option><option value="admin">admin</option></select></td>
              <td className="px-4 py-3 text-brand-green font-bold">{formatUSDC(u.total_earned)}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3"><button onClick={()=>toast.error('Ban feature coming soon')} className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg">Ban</button></td>
            </tr>
          ))}</tbody>
        </table>)}
      </div>
    </main></div></div>
  )
}
