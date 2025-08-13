import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType, LoginCredentials } from '../types/auth';
import { authService } from '../services/auth';
import { AuthContext } from './AuthContextProvider';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app startup
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const existingToken = authService.isTokenValid();
        
        if (existingToken) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setToken(authService.getToken());
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid token
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      setToken(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};