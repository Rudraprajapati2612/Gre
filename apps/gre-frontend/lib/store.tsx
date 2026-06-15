'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from './api';
import type { User } from './api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.restoreSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const data = await api.register(email, password, displayName);
    setUser(data.user);
  };

  const logout = async () => {
    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('summit_refresh') : null;
    if (refreshToken) await api.logoutApi(refreshToken);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProvider');
  return ctx;
}

// Backward-compatible alias
export const useApp = useAuth;
