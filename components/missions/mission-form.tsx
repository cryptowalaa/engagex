'use client'
import { useState } from 'react'
import { useMissions } from '@/hooks/use-missions'
import { useUser } from '@/hooks/use-user'
import { MISSION_CATEGORIES, PLATFORMS } from '@/lib/config'
import { cn } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function MissionForm() {
  const router = useRouter()
  const { createMission } = useMissions()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    reward_pool: '',
    currency: 'USDC',
    deadline: '',
    max_winners: '10',
    category: 'Social Media',
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { toast.error('Connect your wallet first'); return }
    setLoading(true)
    try {
      const { error } = await createMission({
        ...form,
        brand_id: user.id,
        reward_pool: parseFloat(form.reward_pool),
        max_winners: parseInt(form.max_winners),
        status: 'draft',
      })
      if (error) throw error
      toast.success('Mission created successfully!')
      router.push('/brand/missions')
    } catch (e: any) {
      toast.error(e.message || 'Failed to create mission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Mission Title *</label>
          <input
            className="form-input"
            placeholder="e.g. Create a viral tweet about our new product"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
          <textarea
            className="form-input resize-none"
            rows={4}
            placeholder="Describe what creators need to do..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder="Specific requirements (hashtags, mentions, minimum followers...)"
            value={form.requirements}
            onChange={e => update('requirements', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Reward Pool *</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="1"
              className="form-input flex-1"
              placeholder="100"
              value={form.reward_pool}
              onChange={e => update('reward_pool', e.target.value)}
              required
            />
            <select
              className="form-input w-28"
              value={form.currency}
              onChange={e => update('currency', e.target.value)}
            >
              <option value="USDC">USDC</option>
              <option value="SOL">SOL</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Winners *</label>
          <input
            type="number"
            min="1"
            max="100"
            className="form-input"
            value={form.max_winners}
            onChange={e => update('max_winners', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Deadline *</label>
          <input
            type="datetime-local"
            className="form-input"
            value={form.deadline}
            onChange={e => update('deadline', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            className="form-input"
            value={form.category}
            onChange={e => update('category', e.target.value)}
          >
            {MISSION_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-brand-border rounded-xl text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex-1 py-3 bg-brand-green text-brand-dark font-bold rounded-xl',
            'hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading ? 'Creating...' : 'Create Mission'}
        </button>
      </div>
    </form>
  )
}
