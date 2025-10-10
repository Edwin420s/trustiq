import React, { createContext, useContext, useState, useEffect } from 'react';
import { TrustIQApi } from '../lib/api';

interface User {
  id: string;
  walletAddress: string;
  did: string;
  trustScore: number;
}

interface AuthContextType {
  user: User | null;
  login: (walletAddress: string, signature: string, message: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('trustiq_token');
    if (token) {
      TrustIQApi.setAuthToken(token);
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await TrustIQApi.getCurrentUser();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('trustiq_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (walletAddress: string, signature: string, message: string) => {
    try {
      const { user: userData, token } = await TrustIQApi.walletLogin(
        walletAddress,
        signature,
        message
      );
      
      localStorage.setItem('trustiq_token', token);
      TrustIQApi.setAuthToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('trustiq_token');
    TrustIQApi.setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}