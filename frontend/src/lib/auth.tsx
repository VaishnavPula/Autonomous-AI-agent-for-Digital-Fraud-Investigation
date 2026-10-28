'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest, Token } from '@/types/auth';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiClient.get<User>('/auth/me');
      setUser(userData);
    } catch (error) {
      setToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
      apiClient.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedToken && storedRefreshToken) {
      setToken(storedToken);
      apiClient.setToken(storedToken);
      apiClient.setRefreshToken(storedRefreshToken);
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.post<Token>('/auth/login', credentials);
    const newToken = response.access_token;
    const refreshToken = response.refresh_token;
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('refresh_token', refreshToken);
    apiClient.setToken(newToken);
    apiClient.setRefreshToken(refreshToken);
    await refreshUser();
  };

  const register = async (data: RegisterRequest) => {
    const response = await apiClient.post<Token>('/auth/register', data);
    const newToken = response.access_token;
    const refreshToken = response.refresh_token;
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('refresh_token', refreshToken);
    apiClient.setToken(newToken);
    apiClient.setRefreshToken(refreshToken);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      apiClient.clearTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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