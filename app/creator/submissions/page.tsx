'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { useSubmissions } from '@/hooks/use-submissions'
import { timeAgo } from '@/lib/utils/helpers'
import { FileText, ExternalLink } from 'lucide-react'

export default function CreatorSubmissions() {
  const { user } = useUser()
  const { submissions, loading } = useSubmissions(undefined, user?.id)
  const statusColor = (s: string) => s === 'winner' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : s === 'approved' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : s === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-400/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-3xl font-black mb-2">My <span className="text-brand-green">Submissions</span></h1>
          <p className="text-gray-400 mb-8">Track your content submissions and scores</p>
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
            {loading ? <div className="p-10 text-center text-gray-500">Loading...</div>
            : submissions.length === 0 ? (
              <div className="p-10 text-center">
                <FileText size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No submissions yet. Browse missions and submit content!</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-brand-border">
                  <tr>{['Mission', 'Platform', 'Score', 'Status', 'Date', 'Link'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id} className="border-b border-brand-border/40 hover:bg-white/2">
                      <td className="px-4 py-3 font-medium text-white">{(sub as any).mission?.title || 'Mission'}</td>
                      <td className="px-4 py-3 capitalize text-gray-400">{sub.platform}</td>
                      <td className="px-4 py-3 font-bold text-brand-green">{sub.score.toFixed(0)} pts</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(sub.status)}`}>{sub.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(sub.submitted_at)}</td>
                      <td className="px-4 py-3"><a href={sub.content_link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-brand-green"><ExternalLink size={14} /></a></td>
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
