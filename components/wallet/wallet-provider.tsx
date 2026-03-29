'use client'
import { ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getWallets, SOLANA_RPC_ENDPOINT } from '@/lib/solana/wallet-adapter'

// Import default wallet adapter styles
require('@solana/wallet-adapter-react-ui/styles.css')

interface Props {
  children: ReactNode
}

export function SolanaWalletProvider({ children }: Props) {
  // Auto-detect all injected wallets (Phantom, Backpack, etc.)
  const wallets = useMemo(() => getWallets(), [])

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
