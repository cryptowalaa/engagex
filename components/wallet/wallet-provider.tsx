'use client'
import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { getWallets, SOLANA_RPC_ENDPOINT } from '@/lib/solana/wallet-adapter'

// Import default wallet adapter styles
require('@solana/wallet-adapter-react-ui/styles.css')

interface Props {
  children: ReactNode
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  // Auto-detect all injected wallets (Phantom, Backpack, etc.)
  const wallets = useMemo(() => getWallets(), [])

  return (
    <>
      <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT} children={undefined}>
        <WalletProvider wallets={wallets} autoConnect children={undefined}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  )
}
