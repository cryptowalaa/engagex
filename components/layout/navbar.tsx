'use client'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/wallet/wallet-button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { APP_CONFIG } from '@/lib/config'
import Image from 'next/image'

const navLinks = [
  { label: 'Missions', href: '/missions' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Dashboard', href: '/user' },
]

export function Navbar() {
  const { publicKey } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-dark/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand Name */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center overflow-hidden">
              <Image 
                src="/logo.PNG" 
                alt="EngageZ" 
                width={32} 
                height={32}
                className="object-cover"
              />
            </div>
            <span className="gradient-text">EngageZ</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="text-gray-400 hover:text-brand-green transition-colors text-sm font-medium">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-brand-purple hover:text-brand-purple/80 transition-colors text-sm font-medium">
                Admin Panel
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <WalletButton />
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-gray-400">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-card px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className="block text-gray-300 hover:text-brand-green py-2 text-sm">
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className="block text-brand-purple py-2 text-sm">Admin Panel</Link>
          )}
        </div>
      )}
    </nav>
  )
}
