'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useMissions } from '@/hooks/use-missions'
import { CheckCircle, XCircle, Trash2, Edit2, Save, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useState } from 'react'
import Link from 'next/link'

export default function AdminMissions() {
  const { missions, loading, refetch } = useMissions()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  
  const approve = async (id: string) => { 
    await (supabase.from('missions') as any).update({ status: 'active' }).eq('id', id)
    refetch()
    toast.success('Approved!') 
  }
  
  const reject = async (id: string) => { 
    await (supabase.from('missions') as any).update({ status: 'cancelled' }).eq('id', id)
    refetch()
    toast.success('Rejected') 
  }

  const deleteMission = async (id: string) => {
    if (!confirm('Are you sure? This will permanently delete the mission and all submissions!')) return
    try {
      await (supabase.from('submissions') as any).delete().eq('mission_id', id)
      await (supabase.from('missions') as any).delete().eq('id', id)
      refetch()
      toast.success('Mission deleted!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  const startEdit = (mission: any) => {
    setEditingId(mission.id)
    setEditForm({
      title: mission.title,
      description: mission.description,
      reward_pool: mission.reward_pool,
      max_winners: mission.max_winners
    })
  }

  const saveEdit = async (id: string) => {
    try {
      await (supabase.from('missions') as any)
        .update({ ...editForm, updated_at: new Date().toISOString() })
        .eq('id', id)
      setEditingId(null)
      refetch()
      toast.success('Updated!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }
  
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-8">Manage <span className="text-brand-purple">Missions</span></h1>
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            {loading ? <div className="p-10 text-center text-gray-500">Loading...</div> : (
              <table className="w-full text-sm">
                <thead className="border-b border-brand-border">
                  <tr>
                    {['Title','Pool','Status','Deadline','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {missions.map(m => (
                    <tr key={m.id} className="border-b border-brand-border/40">
                      <td className="px-4 py-3">
                        {editingId === m.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white text-sm"
                            />
                            <textarea
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              className="w-full bg-brand-dark border border-brand-border rounded px-3 py-2 text-white text-sm"
                              rows={2}
                            />
                          </div>
                        ) : (
                          <div className="font-medium text-white max-w-xs truncate">{m.title}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === m.id ? (
                          <input
                            type="number"
                            value={editForm.reward_pool || ''}
                            onChange={(e) => setEditForm({...editForm, reward_pool: parseFloat(e.target.value)})}
                            className="w-24 bg-brand-dark border border-brand-border rounded px-3 py-2 text-white text-sm"
                          />
                        ) : (
                          <span className="text-brand-green font-bold">{m.reward_pool} {m.currency}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          m.status==='active'?'bg-brand-green/10 text-brand-green border-brand-green/20':
                          'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.deadline).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {editingId === m.id ? (
                            <>
                              <button onClick={() => saveEdit(m.id)} className="p-2 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-lg">
                                <Save size={16} />
                              </button>
                              <button onClick={cancelEdit} className="p-2 bg-gray-500/10 text-gray-400 border border-gray-400/20 rounded-lg">
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link href={`/missions/${m.id}`} target="_blank" className="p-2 bg-brand-purple/10 text-brand-purple border border-brand-purple/20 rounded-lg">
                                <ExternalLink size={16} />
                              </Link>
                              <button onClick={() => startEdit(m)} className="p-2 bg-blue-500/10 text-blue-400 border border-blue-400/20 rounded-lg">
                                <Edit2 size={16} />
                              </button>
                              {m.status==='draft' && (
                                <>
                                  <button onClick={()=>approve(m.id)} className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-lg font-semibold">
                                    <CheckCircle size={14} className="inline mr-1"/> Approve
                                  </button>
                                  <button onClick={()=>reject(m.id)} className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg font-semibold">
                                    <XCircle size={14} className="inline mr-1"/> Reject
                                  </button>
                                </>
                              )}
                              <button onClick={() => deleteMission(m.id)} className="p-2 bg-red-500/10 text-red-400 border border-red-400/20 rounded-lg hover:bg-red-500/20">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
