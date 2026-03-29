import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatSOL(amount: number): string {
  return `${amount.toFixed(4)} SOL`
}

export function formatUSDC(amount: number): string {
  return `${amount.toFixed(2)} USDC`
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function timeUntil(date: string): string {
  const now = new Date()
  const target = new Date(date)
  if (target < now) return 'Expired'
  return formatDistanceToNow(target, { addSuffix: false })
}

export function generateReferralCode(walletAddress: string): string {
  return walletAddress.slice(0, 8).toUpperCase()
}

export function isAdminWallet(address: string): boolean {
  return address === process.env.NEXT_PUBLIC_ADMIN_WALLET
}

export function calculateScore(likes: number, comments: number, shares: number, watchTime: number): number {
  return likes * 1 + comments * 3 + shares * 5 + watchTime * 2
}
