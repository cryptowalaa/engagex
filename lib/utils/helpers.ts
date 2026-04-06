import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatSOL(amount: number): string {
  return `${amount?.toFixed(4) || '0.0000'} SOL`
}

export function formatUSDC(amount: number): string {
  return `${amount?.toFixed(2) || '0.00'} USDC`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Unknown'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid date'
    return format(d, 'MMM dd, yyyy')
  } catch {
    return 'Unknown'
  }
}

// FIXED: timeAgo with proper error handling
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'Unknown'
  try {
    const d = new Date(date)
    // Check if date is valid
    if (isNaN(d.getTime())) return 'Invalid date'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch (error) {
    return 'Unknown'
  }
}

// FIXED: timeUntil with proper error handling
export function timeUntil(date: string | Date | null | undefined): string {
  if (!date) return 'Unknown'
  try {
    const now = new Date()
    const target = new Date(date)
    // Check if dates are valid
    if (isNaN(target.getTime()) || isNaN(now.getTime())) return 'Unknown'
    if (target < now) return 'Expired'
    return formatDistanceToNow(target, { addSuffix: false })
  } catch (error) {
    return 'Unknown'
  }
}

export function generateReferralCode(walletAddress: string): string {
  if (!walletAddress) return ''
  return walletAddress.slice(0, 8).toUpperCase()
}

export function isAdminWallet(address: string): boolean {
  if (!address) return false
  return address === process.env.NEXT_PUBLIC_ADMIN_WALLET
}

export function calculateScore(likes: number, comments: number, shares: number, watchTime: number): number {
  return (likes || 0) * 1 + (comments || 0) * 3 + (shares || 0) * 5 + (watchTime || 0) * 2
}
