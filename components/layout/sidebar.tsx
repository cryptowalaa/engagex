'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  LayoutDashboard, Target, FileText, Trophy, User, 
  Users, Gift, Shield, Zap, TrendingUp, Building2, 
  CheckCircle, Clock, Crown
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import { cn } from '@/lib/utils/helpers'
import { useUser } from '@/hooks/use-user'

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
  { href: '/admin/brands', label: 'Brand Applications', icon: Building2 },
  { href: '/admin/official-brands', label: 'Official Brands', icon: Crown },  // ✅ NEW: Yellow tick management
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
  const { isAdmin, isBrand, isBrandPending, user } = useUser()

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
        <span className="font-bold gradient-text">Engagez</span>
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

      {/* Brand Section Logic */}
      <div>
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Brand</p>
        <div className="space-y-1">
          {isBrand ? (
            // Approved Brand - Show full dashboard
            brandLinks.map(link => <SidebarLink key={link.href} {...link} />)
          ) : isBrandPending ? (
            // Pending Approval
            <div className="px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                <Clock size={16} />
                <span>Approval Pending</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Your application is under review</p>
            </div>
          ) : (
            // Not applied yet - Show Apply button
            <Link 
              href="/brand/apply"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                pathname === '/brand/apply'
                  ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                  : 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/20'
              )}
            >
              <Building2 size={16} />
              Apply as Brand
            </Link>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">General</p>
        <div className="space-y-1">
          {commonLinks.map(link => <SidebarLink key={link.href} {...link} />)}
        </div>
      </div>

      {/* Show Green Verified Badge if approved brand */}
      {isBrand && user?.is_verified && !user?.is_official_verified && (
        <div className="px-3 py-2.5 rounded-lg bg-brand-green/10 border border-brand-green/20">
          <div className="flex items-center gap-2 text-brand-green text-sm font-medium">
            <CheckCircle size={16} className="fill-current" />
            <span>Verified Brand</span>
          </div>
        </div>
      )}

      {/* ✅ NEW: Show Yellow Official Badge if official verified brand */}
      {isBrand && user?.is_official_verified && (
        <div className="px-3 py-2.5 rounded-lg bg-[#FFAD1F]/10 border border-[#FFAD1F]/20">
          <div className="flex items-center gap-2 text-[#FFAD1F] text-sm font-medium">
            <Crown size={16} className="fill-current" />
            <span>Official Brand</span>
          </div>
        </div>
      )}
    </aside>
  )
}
