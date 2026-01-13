import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types';
import { API_CONFIG } from '@/config/api';
import { mockPatients, mockDoctors } from '@/services/mockData';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const AUTH_USER_KEY = 'mindcarex_auth_user';
const AUTH_TOKEN_KEY = 'mindcarex_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        
        // Validate token with backend if not in mock mode
        if (!API_CONFIG.USE_MOCK) {
          validateToken(storedToken).catch(() => {
            // Token invalid, clear auth state
            clearAuthState();
          });
        }
      } catch (e) {
        clearAuthState();
      }
    }
    setIsLoading(false);
  }, []);

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const saveAuthState = (authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  };

  // Validate token with backend
  const validateToken = async (authToken: string): Promise<AuthUser> => {
    const res = await fetch(`${API_CONFIG.SPRING_BOOT_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error('Token validation failed');
    }
    
    return res.json();
  };

  // Mock login for development
  const mockLogin = async (email: string, password: string): Promise<{ user: AuthUser; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const doctor = mockDoctors.find(d => d.email === email);
    const patient = mockPatients.find(p => p.email === email);
    const foundUser = doctor || patient;
    
    if (foundUser) {
      return {
        user: {
          id: foundUser.id,
          email: foundUser.email || email,
          name: foundUser.name,
          role: foundUser.role,
          created_at: foundUser.created_at,
        },
        token: `mock-jwt-token-${Date.now()}`,
      };
    }
    
    // Accept any email/password for demo
    return {
      user: {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'PATIENT',
        created_at: new Date().toISOString(),
      },
      token: `mock-jwt-token-${Date.now()}`,
    };
  };

  // Mock register for development
  const mockRegister = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole
  ): Promise<{ user: AuthUser; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      user: {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        created_at: new Date().toISOString(),
      },
      token: `mock-jwt-token-${Date.now()}`,
    };
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      let result: { user: AuthUser; token: string };
      
      if (API_CONFIG.USE_MOCK) {
        result = await mockLogin(email, password);
      } else {
        // Call Spring Boot auth endpoint
        const res = await fetch(`${API_CONFIG.SPRING_BOOT_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(error.message || 'Invalid credentials');
        }
        
        result = await res.json();
      }
      
      saveAuthState(result.user, result.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    
    try {
      let result: { user: AuthUser; token: string };
      
      if (API_CONFIG.USE_MOCK) {
        result = await mockRegister(email, password, name, role);
      } else {
        // Call Spring Boot auth endpoint
        const res = await fetch(`${API_CONFIG.SPRING_BOOT_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: 'Registration failed' }));
          throw new Error(error.message || 'Registration failed');
        }
        
        result = await res.json();
      }
      
      saveAuthState(result.user, result.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Optionally call logout endpoint
    if (!API_CONFIG.USE_MOCK && token) {
      try {
        await fetch(`${API_CONFIG.SPRING_BOOT_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (e) {
        // Ignore logout errors
      }
    }
    
    clearAuthState();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
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
