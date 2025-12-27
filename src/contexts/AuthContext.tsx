import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and role
  const fetchUserData = async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, created_at')
        .eq('id', userId)
        .single();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profile && roleData) {
        return {
          id: userId,
          email: email,
          name: profile.name,
          role: roleData.role as UserRole,
          created_at: profile.created_at || new Date().toISOString(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(async () => {
            const userData = await fetchUserData(
              currentSession.user.id,
              currentSession.user.email || ''
            );
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
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id, existingSession.user.email || '')
          .then(userData => {
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
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name,
          email,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw new Error('Failed to create user profile');
      }

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role,
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        throw new Error('Failed to assign user role');
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session && !!user,
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
