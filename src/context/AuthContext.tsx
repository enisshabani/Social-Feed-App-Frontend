import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  tenant_id: string;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, rememberMe: boolean) => void;
  logout: () => void;
  updateUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        try {
          // Fetch user data if token exists
          const response = await api.get('/api/v1/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user profile, token might be invalid/expired.", error);
          // Auto logout on invalid token
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newRefreshToken: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
    } else {
      sessionStorage.setItem('token', newToken);
      sessionStorage.setItem('refreshToken', newRefreshToken);
    }
    setToken(newToken);
    
    // Fetch profile immediately after login
    api.get('/api/v1/auth/me')
      .then(response => {
        setUser(response.data);
      })
      .catch(err => {
        console.error("Failed to fetch user after login", err);
      });
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: UserProfile | null) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
