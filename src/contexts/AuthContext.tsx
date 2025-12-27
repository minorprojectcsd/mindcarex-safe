import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<AppUser | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: (profile as Profile)?.name || supabaseUser.email || '',
        role: roleData?.role as UserRole || null,
        avatar_url: (profile as Profile)?.avatar_url,
        specialization: (profile as Profile)?.specialization,
        license_number: (profile as Profile)?.license_number,
        primary_doctor_id: (profile as Profile)?.primary_doctor_id,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Only synchronous state updates here
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlocks
          setTimeout(async () => {
            const userData = await fetchUserData(currentSession.user);
            setUser(userData);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserData(currentSession.user).then((userData) => {
          setUser(userData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
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

        // Update profile with name
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name, email })
          .eq('id', data.user.id);
          
        if (profileError) {
          console.error('Failed to update profile:', profileError);
        }
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
