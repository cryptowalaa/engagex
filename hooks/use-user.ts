'use client'
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { APP_CONFIG } from '@/lib/config'

export function useUser() {
  const { publicKey, connected } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet

  useEffect(() => {
    if (!publicKey) { setUser(null); return }
    loadOrCreateUser(publicKey.toBase58())
  }, [publicKey])

  async function loadOrCreateUser(walletAddress: string) {
    setLoading(true)
    try {
      // Try to find existing user
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (error && error.code === 'PGRST116') {
        // User doesn't exist — create one
        const role = walletAddress === APP_CONFIG.adminWallet ? 'admin' : 'user'
        const { data: newUser, error: createError } = await (supabase
          .from('users') as any)
          .insert({
            wallet_address: walletAddress,
            role,
            username: `user_${walletAddress.slice(0, 6)}`,
            referral_code: walletAddress.slice(0, 8).toUpperCase(),
          })
          .select()
          .single()

        if (!createError) setUser(newUser)
      } else if (data) {
        setUser(data)
      }
    } catch (e) {
      console.error('useUser error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return
    const { data, error } = await (supabase
      .from('users') as any)
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setUser(data)
    return { data, error }
  }

  return { user, loading, isAdmin, connected, updateUser, refetch: () => publicKey && loadOrCreateUser(publicKey.toBase58()) }
}
