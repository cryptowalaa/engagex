import { Zap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// X (Twitter) Icon Component
function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

// Discord Icon Component
function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-card/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center overflow-hidden">
              <Image 
                src="/logo.PNG" 
                alt="EngageZ" 
                width={40} 
                height={40}
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-bold gradient-text text-xl">EngageZ</span>
              <p className="text-xs text-gray-500">Web3 Engagement Platform</p>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://x.com/engagez_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-brand-dark border border-brand-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-green/50 transition-all"
              title="Follow us on X"
            >
              <XIcon size={18} />
            </a>
            <a 
              href="https://discord.gg/2GfkVek4jV" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-brand-dark border border-brand-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-purple/50 transition-all"
              title="Join our Discord"
            >
              <DiscordIcon size={18} />
            </a>
          </div>
        </div>

        {/* Middle Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-t border-brand-border">
          <p className="text-gray-500 text-sm text-center">
            Built on <span className="text-brand-green">Solana</span> · Powered by attention economy
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/missions" className="hover:text-brand-green transition-colors">Missions</Link>
            <Link href="/leaderboard" className="hover:text-brand-green transition-colors">Leaderboard</Link>
            <Link href="/user" className="hover:text-brand-green transition-colors">Dashboard</Link>
          </div>
        </div>

        {/* Bottom Section - Terms & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-brand-border">
          <div className="text-xs text-gray-600">
            © 2024 EngageZ. All rights reserved. Not financial advice.
          </div>
          <Link 
            href="/terms" 
            className="text-xs text-gray-500 hover:text-brand-green transition-colors flex items-center gap-1"
          >
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  )
}
