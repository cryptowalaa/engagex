'use client'
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { APP_CONFIG } from '@/lib/config'

export function useUser() {
  const { publicKey, connected } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = publicKey?.toBase58() === APP_CONFIG.adminWallet || user?.role === 'admin'

  useEffect(() => {
    if (!publicKey) { 
      setUser(null)
      setLoading(false)
      return 
    }
    loadOrCreateUser(publicKey.toBase58())
  }, [publicKey])

  async function loadOrCreateUser(walletAddress: string) {
    setLoading(true)
    try {
      // ✅ FIXED: Use maybeSingle() instead of single() to avoid errors
      const { data, error } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle()

      if (error) {
        console.error('Fetch user error:', error)
        setLoading(false)
        return
      }

      if (data) {
        setUser(data)
        setLoading(false)
        return
      }

      // User doesn't exist — create one
      const role = walletAddress === APP_CONFIG.adminWallet ? 'admin' : 'user'
      const { data: newUser, error: createError } = await (supabase
        .from('users') as any)
        .insert({
          wallet_address: walletAddress,
          role,
          username: `user_${walletAddress.slice(0, 6)}`,
          referral_code: walletAddress.slice(0, 8).toUpperCase(),
          total_points: 0,
          total_earned: 0,
          is_verified: false,
          brand_status: null,
        })
        .select()
        .single()

      if (!createError && newUser) {
        setUser(newUser)
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
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', user.wallet_address)
      .select()
      .single()
    if (!error && data) setUser(data)
    return { data, error }
  }

  async function applyAsBrand(brandData: {
    website_url: string
    twitter_handle: string
    discord_handle?: string
    linkedin_url?: string
    telegram_handle?: string
    bio?: string
  }) {
    if (!user) return { error: 'No user' }
    
    try {
      const { data, error } = await (supabase
        .from('users') as any)
        .update({
          role: 'brand_pending',
          brand_status: 'pending',
          brand_submitted_at: new Date().toISOString(),
          website_url: brandData.website_url,
          twitter_handle: brandData.twitter_handle,
          discord_handle: brandData.discord_handle || null,
          linkedin_url: brandData.linkedin_url || null,
          telegram_handle: brandData.telegram_handle || null,
          bio: brandData.bio || null,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', user.wallet_address)
        .select()
        .single()

      if (!error && data) {
        setUser(data)
        return { success: true, data }
      }
      return { error }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const isBrand = user?.role === 'brand' && user?.brand_status === 'approved'
  const isBrandPending = user?.role === 'brand_pending' || user?.brand_status === 'pending'
  const isCreator = user?.role === 'creator'
  const isUser = user?.role === 'user' || !user?.role

  return { 
    user, 
    loading, 
    isAdmin, 
    isBrand,
    isBrandPending,
    isCreator,
    isUser,
    connected, 
    updateUser, 
    applyAsBrand,
    refetch: () => publicKey && loadOrCreateUser(publicKey.toBase58()) 
  }
}
