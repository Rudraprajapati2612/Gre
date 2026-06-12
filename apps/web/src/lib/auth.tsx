'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiLogin, apiLogout, apiRefresh, apiRegister, tokenStore } from './api'
import type { User } from './types'

const REFRESH_KEY = 'gre_refresh_token'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string, timezone?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const doLogout = useCallback(async () => {
    const rt = localStorage.getItem(REFRESH_KEY)
    if (rt) {
      await apiLogout(rt).catch(() => {})
      localStorage.removeItem(REFRESH_KEY)
    }
    tokenStore.set(null)
    setUser(null)
  }, [])

  // Register the logout fn so the API client can call it on auth failure
  useEffect(() => {
    tokenStore.setLogoutFn(doLogout)
  }, [doLogout])

  // Register the refresh fn
  const doRefresh = useCallback(async (): Promise<string | null> => {
    const rt = localStorage.getItem(REFRESH_KEY)
    if (!rt) return null
    try {
      const data = await apiRefresh(rt)
      if (!data) {
        await doLogout()
        return null
      }
      tokenStore.set(data.accessToken)
      localStorage.setItem(REFRESH_KEY, data.refreshToken)
      return data.accessToken
    } catch {
      await doLogout()
      return null
    }
  }, [doLogout])

  useEffect(() => {
    tokenStore.setRefreshFn(doRefresh)
  }, [doRefresh])

  // On mount: attempt silent refresh to restore session
  useEffect(() => {
    async function restoreSession() {
      const rt = localStorage.getItem(REFRESH_KEY)
      if (!rt) {
        setLoading(false)
        return
      }
      try {
        const data = await apiRefresh(rt)
        if (!data) {
          localStorage.removeItem(REFRESH_KEY)
          setLoading(false)
          return
        }
        tokenStore.set(data.accessToken)
        localStorage.setItem(REFRESH_KEY, data.refreshToken)
        // Fetch user info
        const { apiMe } = await import('./api')
        const { user } = await apiMe()
        setUser(user)
      } catch {
        localStorage.removeItem(REFRESH_KEY)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    tokenStore.set(data.accessToken)
    localStorage.setItem(REFRESH_KEY, data.refreshToken)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName?: string, timezone?: string) => {
    const data = await apiRegister(email, password, displayName, timezone)
    tokenStore.set(data.accessToken)
    localStorage.setItem(REFRESH_KEY, data.refreshToken)
    setUser(data.user)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
