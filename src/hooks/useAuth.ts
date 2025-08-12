import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  is_guest: boolean
  guest_upgraded_at: string | null
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isGuest: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isGuest: false
  })

  // Initialize guest session
  const initializeGuestSession = useCallback(async () => {
    try {
      const guestId = uuidv4()
      const guestProfile: UserProfile = {
        id: guestId,
        email: null,
        full_name: null,
        avatar_url: null,
        is_guest: true,
        guest_upgraded_at: null
      }

      // Store guest profile in localStorage
      localStorage.setItem('tasksmint_guest_profile', JSON.stringify(guestProfile))
      localStorage.setItem('tasksmint_guest_id', guestId)

      setAuthState(prev => ({
        ...prev,
        profile: guestProfile,
        isGuest: true,
        loading: false
      }))
    } catch (error) {
      console.error('Error initializing guest session:', error)
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  // Load user profile from Supabase
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return profile
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    }
  }, [])

  // Create user profile
  const createUserProfile = useCallback(async (user: User) => {
    try {
      const profile = {
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_guest: false,
        guest_upgraded_at: null
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profile)

      if (error) throw error

      return profile
    } catch (error) {
      console.error('Error creating user profile:', error)
      return null
    }
  }, [])

  // Upgrade guest to real user
  const upgradeGuestToUser = useCallback(async (user: User) => {
    try {
      const guestId = localStorage.getItem('tasksmint_guest_id')
      if (!guestId) return

      // Transfer guest data to the new user
      const { error: transferError } = await supabase.rpc('transfer_guest_data', {
        guest_id: guestId,
        new_user_id: user.id
      })

      if (transferError) {
        console.error('Error transferring guest data:', transferError)
      }

      // Clean up guest data
      localStorage.removeItem('tasksmint_guest_profile')
      localStorage.removeItem('tasksmint_guest_id')

      // Create user profile
      const profile = await createUserProfile(user)
      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ guest_upgraded_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      return profile
    } catch (error) {
      console.error('Error upgrading guest to user:', error)
      return null
    }
  }, [createUserProfile])

  // Sign in with email magic link
  const signInWithEmail = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error signing in with email:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Sign in with OAuth
  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      return { success: false, error: error.message }
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Initialize new guest session
      await initializeGuestSession()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [initializeGuestSession])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // User is authenticated
          const wasGuest = localStorage.getItem('tasksmint_guest_id')
          let profile = await loadUserProfile(session.user.id)

          if (!profile) {
            if (wasGuest) {
              profile = await upgradeGuestToUser(session.user)
            } else {
              profile = await createUserProfile(session.user)
            }
          }

          if (mounted) {
            setAuthState({
              user: session.user,
              profile,
              session,
              loading: false,
              isGuest: false
            })
          }
        } else {
          // No authenticated user, check for guest session
          const guestProfile = localStorage.getItem('tasksmint_guest_profile')
          if (guestProfile) {
            const profile = JSON.parse(guestProfile)
            if (mounted) {
              setAuthState({
                user: null,
                profile,
                session: null,
                loading: false,
                isGuest: true
              })
            }
          } else {
            // Initialize new guest session
            await initializeGuestSession()
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          const wasGuest = localStorage.getItem('tasksmint_guest_id')
          let profile = await loadUserProfile(session.user.id)

          if (!profile) {
            if (wasGuest) {
              profile = await upgradeGuestToUser(session.user)
            } else {
              profile = await createUserProfile(session.user)
            }
          }

          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            isGuest: false
          })
        } else if (event === 'SIGNED_OUT') {
          await initializeGuestSession()
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initializeGuestSession, loadUserProfile, upgradeGuestToUser, createUserProfile])

  return {
    ...authState,
    signInWithEmail,
    signInWithOAuth,
    signOut
  }
}