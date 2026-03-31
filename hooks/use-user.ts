'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { APP_CONFIG } from '@/lib/config'

export function useUser() {
  const { publicKey, connected } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = publicKey?.toBase58()

  // Check admin by wallet
  const isAdmin = walletAddress === APP_CONFIG.adminWallet || user?.role === 'admin'

  // Load or create user
  const loadOrCreateUser = useCallback(async (address: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Try to find existing user by wallet_address
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle()

      if (fetchError) {
        console.error('Fetch user error:', fetchError)
        setError(fetchError.message)
        setLoading(false)
        return
      }

      if (data) {
        setUser(data)
        setLoading(false)
        return
      }

      // User doesn't exist — create one
      const role = address === APP_CONFIG.adminWallet ? 'admin' : 'user'
      const newUser = {
        wallet_address: address,
        role,
        username: `user_${address.slice(0, 6)}`,
        referral_code: address.slice(0, 8).toUpperCase(),
        total_points: 0,
        total_earned: 0,
        is_verified: false,
        brand_status: null,
      }

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()

      if (createError) {
        console.error('Create user error:', createError)
        setError(createError.message)
      } else {
        setUser(createdUser)
      }
    } catch (e: any) {
      console.error('useUser error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!walletAddress) {
      setUser(null)
      setLoading(false)
      return
    }
    
    loadOrCreateUser(walletAddress)
  }, [walletAddress, loadOrCreateUser])

  // Update user profile
  const updateUser = async (updates: Partial<User>) => {
    if (!user?.wallet_address) {
      return { error: 'No user wallet connected' }
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', user.wallet_address)
        .select()
        .single()
      
      if (error) throw error
      
      if (data) setUser(data)
      return { data, error: null }
    } catch (error: any) {
      console.error('Update user error:', error)
      return { data: null, error }
    }
  }

  // Apply as Brand
  const applyAsBrand = async (brandData: {
    website_url: string
    twitter_handle: string
    discord_handle?: string
    linkedin_url?: string
    telegram_handle?: string
    bio?: string
  }) => {
    if (!user?.wallet_address) return { error: 'No user connected' }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role: 'brand_pending',
          brand_status: 'pending',
          brand_submitted_at: new Date().toISOString(),
          ...brandData,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', user.wallet_address)
        .select()
        .single()

      if (error) throw error
      
      if (data) setUser(data)
      return { success: true, data }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  // Refetch user data
  const refetch = useCallback(() => {
    if (walletAddress) {
      loadOrCreateUser(walletAddress)
    }
  }, [walletAddress, loadOrCreateUser])

  // Role checks
  const isBrand = user?.role === 'brand' && user?.brand_status === 'approved'
  const isBrandPending = user?.role === 'brand_pending' || user?.brand_status === 'pending'
  const isCreator = user?.role === 'creator'

  return { 
    user, 
    loading, 
    error,
    isAdmin, 
    isBrand,
    isBrandPending,
    isCreator,
    isUser: !isAdmin && !isBrand && !isCreator,
    connected, 
    updateUser, 
    applyAsBrand,
    refetch
  }
}
