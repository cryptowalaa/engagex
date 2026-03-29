'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  LayoutDashboard, Target, FileText, Trophy, User, 
  Users, Gift, Shield, Zap, TrendingUp 
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import { cn } from '@/lib/utils/helpers'

const creatorLinks = [
  { href: '/creator', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/missions', label: 'Browse Missions', icon: Target },
  { href: '/creator/submissions', label: 'My Submissions', icon: FileText },
]

const brandLinks = [
  { href: '/brand', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/brand/missions', label: 'My Missions', icon: Target },
  { href: '/brand/missions/create', label: 'Create Mission', icon: TrendingUp },
]

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/missions', label: 'Manage Missions', icon: Target },
  { href: '/admin/users', label: 'Manage Users', icon: Users },
  { href: '/admin/rewards', label: 'Distribute Rewards', icon: Gift },
]

const commonLinks = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/referrals', label: 'Referrals', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { publicKey } = useWallet()
  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  const SidebarLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
    <Link href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        pathname === href
          ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}>
      <Icon size={16} />
      {label}
    </Link>
  )

  return (
    <aside className="w-60 min-h-screen border-r border-brand-border bg-brand-card/50 p-4 space-y-6">
      <Link href="/" className="flex items-center gap-2 px-3 pt-2 pb-4 border-b border-brand-border">
        <div className="w-7 h-7 rounded-lg bg-brand-green flex items-center justify-center">
          <Zap size={14} className="text-brand-dark" />
        </div>
        <span className="font-bold gradient-text">EngageX</span>
      </Link>

      {isAdmin && (
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Admin</p>
          <div className="space-y-1">
            {adminLinks.map(link => <SidebarLink key={link.href} {...link} />)}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Creator</p>
        <div className="space-y-1">
          {creatorLinks.map(link => <SidebarLink key={link.href} {...link} />)}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Brand</p>
        <div className="space-y-1">
          {brandLinks.map(link => <SidebarLink key={link.href} {...link} />)}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">General</p>
        <div className="space-y-1">
          {commonLinks.map(link => <SidebarLink key={link.href} {...link} />)}
        </div>
      </div>
    </aside>
  )
}
