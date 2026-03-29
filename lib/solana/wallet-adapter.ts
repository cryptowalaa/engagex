'use client'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

export const SOLANA_NETWORK = WalletAdapterNetwork.Mainnet

export const SOLANA_RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  'https://mainnet.helius-rpc.com/?api-key=f233023a-dce8-46de-9deb-bfb6b2ea872e'

// All supported wallets — auto-detect detects injected wallets automatically
export function getWallets() {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: SOLANA_NETWORK }),
    new CoinbaseWalletAdapter(),
  ]
}
