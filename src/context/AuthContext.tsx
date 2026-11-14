import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserProfile } from '../types/motorcycle.ts';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    phone?: string;
    city?: string;
    savedBikeIds?: number[];
  }) => Promise<UserProfile>;
  toggleSaveBike: (bikeId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Sign in failed.');
    }
    setUser(data.user);
    return data.user as UserProfile;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string; city?: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      setUser(data.user);
      return data.user as UserProfile;
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (payload: { name?: string; phone?: string; city?: string; savedBikeIds?: number[] }) => {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not update profile.');
      }
      setUser(data.user);
      return data.user as UserProfile;
    },
    [],
  );

  const toggleSaveBike = useCallback(
    async (bikeId: number) => {
      if (!user) return;
      const exists = user.savedBikeIds.includes(bikeId);
      const next = exists
        ? user.savedBikeIds.filter((id) => id !== bikeId)
        : [...user.savedBikeIds, bikeId];
      await updateProfile({ savedBikeIds: next });
    },
    [user, updateProfile],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, updateProfile, toggleSaveBike }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
