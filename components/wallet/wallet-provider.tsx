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

export function SolanaWalletProvider({ children }: Props): JSX.Element {
  // Auto-detect all injected wallets (Phantom, Backpack, etc.)
  const wallets = useMemo(() => getWallets(), [])

  return (
    <>
      {/* @ts-ignore - React 18 type compatibility issue with Solana wallet adapter */}
      <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
        {/* @ts-ignore - React 18 type compatibility issue with Solana wallet adapter */}
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  )
}
