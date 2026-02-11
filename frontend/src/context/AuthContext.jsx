import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Ne PAS initialiser depuis localStorage pour éviter les données obsolètes
  const [user, setUser] = useState(null);
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
      // Mettre à jour le localStorage avec les données fraîches
      localStorage.setItem('user', JSON.stringify(merged));
    } catch (error) {
      // Ne déconnecter QUE si c'est une erreur d'authentification (401)
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        // Pour les autres erreurs (réseau, serveur), utiliser les données en cache si disponibles
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          console.warn('Erreur réseau - utilisation des données en cache');
          setUser(JSON.parse(cachedUser));
        } else {
          console.warn('Erreur lors du refresh du profil:', error.message);
        }
      }
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
    // Récupérer le profil à jour depuis l'API après connexion
    await refreshProfile();
    return user;
  };

  const signUp = async (userData) => {
    const res = await authApi.signUp(userData);
    const token = res.headers.authorization?.replace('Bearer ', '');
    if (token) {
      localStorage.setItem('token', token);
    }
    // Récupérer le profil à jour depuis l'API après inscription
    await refreshProfile();
    return user;
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
