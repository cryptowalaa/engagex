import { Connection, clusterApiUrl } from '@solana/web3.js'

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 
  'https://mainnet.helius-rpc.com/?api-key=f233023a-dce8-46de-9deb-bfb6b2ea872e'

// Primary: Helius Mainnet RPC (fast, reliable)
export const connection = new Connection(HELIUS_RPC, {
  commitment: 'confirmed',
  wsEndpoint: HELIUS_RPC.replace('https', 'wss'),
})

// Gatekeeper (ultra-low latency beta)
export const gatekeeperConnection = new Connection(
  'https://beta.helius-rpc.com/?api-key=f233023a-dce8-46de-9deb-bfb6b2ea872e',
  { commitment: 'confirmed' }
)

export const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || 
  'Dq7SP6JMswPPCdiyhKjnigHc3L4sWGmEfvWwPSiSn5cY'

export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || 
  'A9GT8pYUR5F1oRwUsQ9ADeZTWq7LJMfmPQ3TZLmV6cQP'

export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const { PublicKey } = await import('@solana/web3.js')
    const pubkey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(pubkey)
    return balance / 1e9 // Convert lamports to SOL
  } catch {
    return 0
  }
}
