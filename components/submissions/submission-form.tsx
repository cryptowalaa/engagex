'use client'
import { useState } from 'react'
import { useSubmissions } from '@/hooks/use-submissions'
import { useUser } from '@/hooks/use-user'
import { PLATFORMS } from '@/lib/config'
import toast from 'react-hot-toast'

const INPUT = "w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"

interface Props { missionId: string; onSuccess?: () => void }

export function SubmissionForm({ missionId, onSuccess }: Props) {
  const { createSubmission } = useSubmissions(missionId)
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ content_link: '', platform: 'twitter', description: '' })

  async function handleSubmit() {
    if (!user) { toast.error('Connect wallet first'); return }
    if (!form.content_link) { toast.error('Content link required'); return }
    setLoading(true)
    try {
      const { error } = await createSubmission({ ...form, mission_id: missionId, creator_id: user.id } as any)
      if (error) throw error
      toast.success('Submission sent! 🎉')
      setForm({ content_link: '', platform: 'twitter', description: '' })
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
        <select className={INPUT} value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}>
          {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Content Link *</label>
        <input className={INPUT} type="url" placeholder="https://twitter.com/yourpost/..." value={form.content_link} onChange={e => setForm(p => ({ ...p, content_link: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
        <textarea className={`${INPUT} resize-none`} rows={3} placeholder="Additional notes..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-brand-green text-brand-dark font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit Entry'}
      </button>
    </div>
  )
}
