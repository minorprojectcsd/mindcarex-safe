import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

type UserRole = 'PATIENT' | 'DOCTOR';

interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  specialization: string | null;
  license_number: string | null;
  primary_doctor_id: string | null;
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  avatar_url?: string | null;
  specialization?: string | null;
  license_number?: string | null;
  primary_doctor_id?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (supabaseUser: SupabaseUser, retryCount = 0): Promise<AppUser | null> => {
    // Fetch profile and role in parallel
    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', supabaseUser.id).maybeSingle()
    ]);

    const profile = profileResult.data as Profile | null;
    const roleData = roleResult.data;

    // If no role found and we haven't retried too many times, wait and retry
    // This handles the race condition where role insert hasn't completed yet
    if (!roleData?.role && retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchUserData(supabaseUser, retryCount + 1);
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.name || supabaseUser.email || '',
      role: roleData?.role as UserRole || null,
      avatar_url: profile?.avatar_url,
      specialization: profile?.specialization,
      license_number: profile?.license_number,
      primary_doctor_id: profile?.primary_doctor_id,
    };
  }, []);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await fetchUserData(session.user);
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Insert user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role });
        
        if (roleError) {
          console.error('Failed to set user role:', roleError);
        }

        // Update profile with additional info if doctor
        if (role === 'DOCTOR') {
          await supabase
            .from('profiles')
            .update({ name })
            .eq('id', data.user.id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
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
