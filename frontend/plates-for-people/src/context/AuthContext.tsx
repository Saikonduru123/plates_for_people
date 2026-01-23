import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import type { User, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<User>;
  logout: () => void;
  registerDonor: (data: RegisterRequest) => Promise<void>;
  registerNGO: (
    data: RegisterRequest & {
      organization_name: string;
      registration_number: string;
      address: string;
      description?: string;
    },
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage and verify on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const userData = await authService.me();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token validation failed:', error);
          // Clear invalid token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);

      // Fetch user data after successful login
      const userData = await authService.me();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Small delay to ensure state is updated before navigation
      await new Promise((resolve) => setTimeout(resolve, 100));

      return userData;
    } catch (error) {
      // Clean up on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const registerDonor = async (data: RegisterRequest) => {
    const response = await authService.registerDonor(data);
    localStorage.setItem('accessToken', response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);

    // Small delay to ensure localStorage is updated and token is available
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch user data after successful registration
    const userData = await authService.me();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const registerNGO = async (
    data: RegisterRequest & {
      organization_name: string;
      registration_number: string;
      address: string;
      description?: string;
    },
  ) => {
    const response = await authService.registerNGO(data);
    localStorage.setItem('accessToken', response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);

    // Small delay to ensure localStorage is updated and token is available
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch user data after successful registration
    const userData = await authService.me();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    registerDonor,
    registerNGO,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
