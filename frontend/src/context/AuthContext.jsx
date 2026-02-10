import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await profileApi.getProfile();
      const userData = res.data.data?.attributes || res.data;
      const merged = { id: res.data.data?.id, ...userData };
      setUser(merged);
      localStorage.setItem('user', JSON.stringify(merged));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const signIn = async (credentials) => {
    const res = await authApi.signIn(credentials);
    // JWT comes in Authorization header
    const token = res.headers.authorization?.replace('Bearer ', '');
    if (token) {
      localStorage.setItem('token', token);
    }
    const userData = res.data.data?.attributes || res.data.status?.data?.attributes || res.data;
    const id = res.data.data?.id || res.data.status?.data?.id;
    const merged = { id, ...userData };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
    return merged;
  };

  const signUp = async (userData) => {
    const res = await authApi.signUp(userData);
    const token = res.headers.authorization?.replace('Bearer ', '');
    if (token) {
      localStorage.setItem('token', token);
    }
    const profile = res.data.data?.attributes || res.data.status?.data?.attributes || res.data;
    const id = res.data.data?.id || res.data.status?.data?.id;
    const merged = { id, ...profile };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
    return merged;
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch {
      // ignore error on sign out
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = { user, loading, signIn, signUp, signOut, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
