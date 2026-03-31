'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { useMissions } from '@/hooks/use-missions'
import { Target, Plus, Edit2, Save, XCircle, ExternalLink } from 'lucide-react'
import { timeUntil } from '@/lib/utils/helpers'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function BrandMissions() {
  const { user } = useUser()
  const { missions, loading, refetch } = useMissions()
  const myMissions = missions.filter(m => m.brand_id === user?.id)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  
  const statusColor = (s: string) => ({ 
    active: 'text-brand-green bg-brand-green/10 border-brand-green/20', 
    draft: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', 
    funded: 'text-blue-400 bg-blue-400/10 border-blue-400/20', 
    completed: 'text-gray-400 bg-gray-400/10 border-gray-400/20', 
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/20' 
  }[s] || '')

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
      toast.success('Mission updated!')
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black">My <span className="text-brand-purple">Missions</span></h1>
              <p className="text-gray-400 mt-1">Manage your launched campaigns</p>
            </div>
            <Link href="/brand/missions/create" className="flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all text-sm">
              <Plus size={16} /> New Mission
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-brand-card rounded-2xl border border-brand-border animate-pulse" />
              ))}
            </div>
          ) : myMissions.length === 0 ? (
            <div className="text-center py-20 bg-brand-card border border-dashed border-brand-border rounded-2xl">
              <Target size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No missions created yet</p>
              <Link href="/brand/missions/create" className="inline-flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-6 py-3 rounded-xl text-sm">
                <Plus size={16} /> Create Mission
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myMissions.map(m => (
                <div key={m.id} className="bg-brand-card border border-brand-border rounded-2xl p-6 card-hover">
                  {editingId === m.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Title</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Description</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-white resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Pool</label>
                          <input
                            type="number"
                            value={editForm.reward_pool || ''}
                            onChange={(e) => setEditForm({...editForm, reward_pool: parseFloat(e.target.value)})}
                            className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Winners</label>
                          <input
                            type="number"
                            value={editForm.max_winners || ''}
                            onChange={(e) => setEditForm({...editForm, max_winners: parseInt(e.target.value)})}
                            className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => saveEdit(m.id)} className="flex-1 flex items-center justify-center gap-2 bg-brand-green text-brand-dark font-bold py-2.5 rounded-xl">
                          <Save size={16} /> Save
                        </button>
                        <button onClick={cancelEdit} className="flex-1 flex items-center justify-center gap-2 bg-brand-dark border border-brand-border text-gray-300 font-bold py-2.5 rounded-xl">
                          <XCircle size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex justify-between mb-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(m.status)}`}>
                          {m.status}
                        </span>
                        <span className="font-black text-brand-green text-lg">{m.reward_pool} {m.currency}</span>
                      </div>
                      <h3 className="font-bold text-white text-lg mb-2">{m.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{m.description}</p>
                      <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-brand-border mb-4">
                        <span>{timeUntil(m.deadline)} left</span>
                        <span>Max {m.max_winners} winners</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/missions/${m.id}`} className="flex-1 flex items-center justify-center gap-2 bg-brand-purple/10 text-brand-purple border border-brand-purple/20 py-2 rounded-xl text-sm font-medium">
                          <ExternalLink size={14} /> View
                        </Link>
                        <button onClick={() => startEdit(m)} className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-400/20 py-2 rounded-xl text-sm font-medium">
                          <Edit2 size={14} /> Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
