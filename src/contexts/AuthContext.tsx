import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { UserRole } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key
const AUTH_USER_KEY = 'mindcarex_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      }
    }
    setIsLoading(false);
  }, []);

  const saveUser = (authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  // Login with Spring Boot API
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      // Create user object from response
      const authUser: AuthUser = {
        id: response.userId || `user-${Date.now()}`,
        email: response.email || email,
        name: response.name || email.split('@')[0],
        role: response.role,
        created_at: new Date().toISOString(),
      };
      
      saveUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register with Spring Boot API
  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    
    try {
      await authService.register({ email, password, role, fullName: name });
      // Registration successful - user should login
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    authService.logout();
    clearUser();
  }, []);

  const handleSetUser = useCallback((newUser: AuthUser | null) => {
    if (newUser) {
      saveUser(newUser);
    } else {
      clearUser();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!localStorage.getItem('token'),
        isLoading,
        login,
        register,
        logout,
        setUser: handleSetUser,
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
