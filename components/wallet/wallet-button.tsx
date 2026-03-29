'use client'
import { FC } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Wallet, ChevronDown, Copy, LogOut } from 'lucide-react'
import { useState } from 'react'
import { shortenAddress } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'

export const WalletButton: FC = () => {
  const { wallet, publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()
  const [showMenu, setShowMenu] = useState(false)

  const handleConnect = () => setVisible(true)

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58())
      toast.success('Address copied!')
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
    setShowMenu(false)
    toast.success('Wallet disconnected')
  }

  if (!publicKey) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-5 py-2.5 rounded-xl 
                   hover:bg-opacity-90 transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]
                   disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <Wallet size={16} />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 bg-brand-card border border-brand-border px-4 py-2.5 rounded-xl 
                   hover:border-brand-green/50 transition-all duration-200 text-sm text-white"
      >
        {wallet?.adapter.icon && (
          <img src={wallet.adapter.icon} alt="wallet" className="w-4 h-4" />
        )}
        <span className="font-mono text-brand-green">{shortenAddress(publicKey.toBase58())}</span>
        <ChevronDown size={14} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-brand-card border border-brand-border rounded-xl 
                        shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border">
            <p className="text-xs text-gray-400">Connected Wallet</p>
            <p className="text-sm font-mono text-brand-green">{shortenAddress(publicKey.toBase58(), 6)}</p>
          </div>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Copy size={14} /> Copy Address
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
