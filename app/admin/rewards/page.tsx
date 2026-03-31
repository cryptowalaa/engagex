'use client'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ✅ NEW: Extended Mission type with status
interface Mission {
  id: string
  title: string
  reward_pool: number
  currency: string
  status: string
  deadline: string
  max_winners: number
  brand: {
    id: string
    username: string | null
  } | null
}

export default function AdminRewards() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selected, setSelected] = useState('')
  const [distributing, setDistributing] = useState(false)
  const [loading, setLoading] = useState(true)

  // ✅ FIXED: Direct fetch - completed, expired, ended sab lao
  useEffect(() => {
    async function loadMissions() {
      try {
        const { data, error } = await supabase
          .from('missions')
          .select(`
            *,
            brand:users(id, username)
          `)
          .in('status', ['completed', 'expired', 'ended'])  // ✅ Multiple statuses
          .order('created_at', { ascending: false })

        if (error) throw error
        setMissions(data || [])
      } catch (error) {
        console.error('Error loading missions:', error)
        toast.error('Failed to load missions')
      } finally {
        setLoading(false)
      }
    }
    
    loadMissions()
  }, [])

  const distribute = async () => {
    if (!selected) return toast.error('Select a mission first')
    
    const mission = missions.find(m => m.id === selected)
    if (!mission) return toast.error('Mission not found')

    setDistributing(true)
    
    try {
      // TODO: Implement actual Solana reward distribution here
      // 1. Fetch submissions/winners for this mission
      // 2. Calculate rewards (60% creators, 20% engagers, 20% platform)
      // 3. Execute USDC transfers on Solana
      // 4. Update mission status to 'rewarded'
      
      await new Promise(r => setTimeout(r, 1500)) // Simulate for now
      
      toast.success(`Rewards distributed for ${mission.title}! 🎉`)
      
      // Refresh list
      setMissions(prev => prev.filter(m => m.id !== selected))
      setSelected('')
    } catch (error) {
      console.error('Distribution error:', error)
      toast.error('Failed to distribute rewards')
    } finally {
      setDistributing(false)
    }
  }

  const selectedMission = missions.find(m => m.id === selected)

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-8">
            Distribute <span className="text-brand-purple">Rewards</span>
          </h1>
          
          <div className="max-w-2xl bg-brand-card border border-brand-border rounded-2xl p-8 space-y-6">
            {/* Mission Select */}
            <div>
              <label className="text-sm text-gray-400 font-semibold block mb-2">
                Select Completed/Expired Mission
              </label>
              
              {loading ? (
                <div className="w-full h-12 bg-brand-dark rounded-xl animate-pulse" />
              ) : missions.length === 0 ? (
                <div className="text-gray-500 text-sm py-3">
                  No missions available for distribution
                </div>
              ) : (
                <select 
                  value={selected} 
                  onChange={e => setSelected(e.target.value)} 
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-green/50"
                >
                  <option value="">-- Select Mission --</option>
                  {missions.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.reward_pool} {m.currency}) - {m.status}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Mission Details */}
            {selectedMission && (
              <div className="bg-brand-dark border border-brand-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${
                    selectedMission.status === 'expired' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {selectedMission.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Deadline:</span>
                  <span className="text-gray-300">
                    {new Date(selectedMission.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Max Winners:</span>
                  <span className="text-gray-300">{selectedMission.max_winners}</span>
                </div>
              </div>
            )}

            {/* Distribution Breakdown */}
            {selected && (
              <div className="grid grid-cols-3 gap-4">
                {[['60%','Creators','text-brand-green'],['20%','Engagers','text-brand-purple'],['20%','Platform','text-yellow-400']].map(([pct,lbl,col])=>(
                  <div key={lbl} className="bg-brand-dark border border-brand-border rounded-xl p-4 text-center">
                    <p className={`text-2xl font-black ${col}`}>{pct}</p>
                    <p className="text-xs text-gray-500 mt-1">{lbl}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Distribute Button */}
            <button 
              onClick={distribute} 
              disabled={distributing || !selected} 
              className="w-full bg-brand-green text-brand-dark font-black py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {distributing ? 'Distributing...' : '🚀 Distribute Rewards'}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              This will distribute USDC rewards to winners via Solana blockchain
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
