import { Zap } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-card/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-green flex items-center justify-center">
              <Zap size={14} className="text-brand-dark" />
            </div>
            <span className="font-bold gradient-text">EngageX</span>
          </div>
          <p className="text-gray-500 text-sm text-center">
            Built on <span className="text-brand-green">Solana</span> · Powered by attention economy
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/missions" className="hover:text-brand-green transition-colors">Missions</Link>
            <Link href="/leaderboard" className="hover:text-brand-green transition-colors">Leaderboard</Link>
            <Link href="/user" className="hover:text-brand-green transition-colors">Dashboard</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-brand-border text-center text-xs text-gray-600">
          © 2024 EngageX. All rights reserved. Not financial advice.
        </div>
      </div>
    </footer>
  )
}
