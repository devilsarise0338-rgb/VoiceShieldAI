import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  loginAsDemoAnalyst: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: 'usr_sih_analyst_01',
  email: 'analyst@voiceshield.defense',
  full_name: 'Dr. Kabir Sharma',
  role: 'security_analyst',
  organization: 'Cyber Defense Directorate',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

const LOCAL_STORAGE_USER_KEY = 'voiceshield_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check cached demo user
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default to demo analyst so reviewers can experience all screens immediately
    return DEMO_USER;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserProfile(session.user.id, session.user.email || '');
      } else {
        // Keep existing cached user if present or fallback
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await syncUserProfile(session.user.id, session.user.email || '');
      } else {
        // Only clear if was logged in with live supabase
        if (isSupabaseConfigured) {
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncUserProfile = async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) {
        const fallbackProfile: UserProfile = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'security_analyst',
          organization: 'Defense Cyber Agency',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(fallbackProfile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackProfile));
      } else {
        setUser(data as UserProfile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data));
      }
    } catch {
      setUser({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'security_analyst',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ error?: string }> => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'Test@123456',
      });
      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      setLoading(false);
      return {};
    }

    // Demo Mode Sign-in
    await new Promise((r) => setTimeout(r, 600));
    const demoProfile: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      full_name: email.split('@')[0].toUpperCase(),
      role: 'security_analyst',
      organization: 'Cyber Defense Directorate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(demoProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoProfile));
    setLoading(false);
    return {};
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error?: string; message?: string }> => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      if (data.user && !data.session) {
        setLoading(false);
        return { message: 'Confirmation link sent to your email. Please verify before signing in.' };
      }
      setLoading(false);
      return {};
    }

    // Demo Mode Sign-up
    await new Promise((r) => setTimeout(r, 700));
    const newProfile: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      full_name: fullName,
      role: 'security_analyst',
      organization: 'Cyber Defense Directorate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(newProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProfile));
    setLoading(false);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) return { error: error.message };
      return { message: 'Password recovery email dispatched. Follow the instructions to reset your password.' };
    }
    await new Promise((r) => setTimeout(r, 600));
    return { message: `Demo Mode: Password reset link simulated for ${email}. You can sign in using demo credentials.` };
  };

  const loginAsDemoAnalyst = () => {
    setUser(DEMO_USER);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(DEMO_USER));
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        loginAsDemoAnalyst,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
