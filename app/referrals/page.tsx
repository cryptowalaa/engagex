'use client'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { Copy, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReferralsPage() {
  const { user } = useUser()
  const code = user?.referral_code || 'Loading...'
  const link = `${typeof window!=='undefined'?window.location.origin:'https://engagex.netlify.app'}?ref=${code}`
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }
  return (
    <div className="min-h-screen bg-brand-dark"><Navbar />
    <div className="flex pt-16"><Sidebar />
    <main className="flex-1 p-6 lg:p-8">
      <h1 className="text-3xl font-black mb-2">Referral <span className="text-brand-green">Program</span></h1>
      <p className="text-gray-400 mb-8">Invite friends and earn rewards when they join</p>
      <div className="max-w-xl space-y-6">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-brand-green" />Your Referral Code</h2>
          <div className="bg-brand-dark border border-brand-green/30 rounded-xl px-5 py-4 flex justify-between items-center">
            <span className="font-mono text-brand-green text-2xl font-bold tracking-widest">{code}</span>
            <button onClick={()=>copy(code)} className="bg-brand-green text-brand-dark font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Copy size={14} />Copy</button>
          </div>
        </div>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">Your Referral Link</h2>
          <div className="bg-brand-dark border border-brand-border rounded-xl px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-gray-400 text-sm truncate">{link}</span>
            <button onClick={()=>copy(link)} className="bg-brand-green/10 text-brand-green border border-brand-green/20 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 flex-shrink-0"><Copy size={12} />Copy</button>
          </div>
        </div>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">How It Works</h2>
          <div className="space-y-3">
            {[['Share your referral link or code',''],['Friend connects wallet using your link',''],['You both earn bonus rewards on their first mission','']].map(([step],i)=>(
              <div key={i} className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div><p className="text-gray-300 text-sm">{step}</p></div>
            ))}
          </div>
        </div>
      </div>
    </main></div></div>
  )
}
