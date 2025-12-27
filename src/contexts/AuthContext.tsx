import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for development
const mockUsers: User[] = [
  {
    id: 'patient-1',
    email: 'patient@demo.com',
    name: 'Sarah Johnson',
    role: 'PATIENT',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'doctor-1',
    email: 'doctor@demo.com',
    name: 'Dr. Michael Chen',
    role: 'DOCTOR',
    created_at: '2023-06-01T10:00:00Z',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === 'demo123') {
      setUser(foundUser);
      localStorage.setItem('auth_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials. Use demo accounts: patient@demo.com or doctor@demo.com with password: demo123');
    }
    
    setIsLoading(false);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: User = {
      id: `${role.toLowerCase()}-${Date.now()}`,
      email,
      name,
      role,
      created_at: new Date().toISOString(),
    };
    
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
  }, []);

  // Check for existing session on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
