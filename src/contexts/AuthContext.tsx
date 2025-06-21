
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  role: 'speler' | 'organisator' | 'beheerder';
  created_at?: string;
  updated_at?: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  is_super_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  adminUser: AdminUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isSuperAdmin: () => boolean;
  logSecurityEvent: (action: string, resourceType?: string, resourceId?: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Don't throw here, just log the error
        return null;
      }

      console.log('User profile fetched:', data);
      setProfile(data as UserProfile);
      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  };

  const fetchAdminUser = async (userId: string) => {
    try {
      console.log('Fetching admin user for:', userId);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching admin user:', error);
        return null;
      }

      console.log('Admin user fetched:', data);
      setAdminUser(data as AdminUser | null);
      return data;
    } catch (error) {
      console.error('Exception fetching admin user:', error);
      return null;
    }
  };

  const logSecurityEvent = async (
    action: string, 
    resourceType?: string, 
    resourceId?: string, 
    details?: any
  ) => {
    try {
      if (!user?.id) return;
      
      console.log('Logging security event:', action);
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  // Force logout on initialization to clear any corrupted state
  useEffect(() => {
    console.log('AuthProvider initializing - forcing logout first...');
    
    const initializeAuth = async () => {
      try {
        // Force logout first to clear any corrupted state
        await supabase.auth.signOut();
        console.log('Forced logout completed');
        
        // Small delay to ensure logout is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now get the session (should be null after logout)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session fetch error:', error);
        }
        
        console.log('Session after forced logout:', session ? 'still exists' : 'cleared');
        
        setSession(session);
        setUser(session?.user ?? null);
        setProfile(null);
        setAdminUser(null);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch additional user data
          Promise.all([
            fetchUserProfile(session.user.id),
            fetchAdminUser(session.user.id)
          ]).catch(error => {
            console.error('Error fetching user data:', error);
          });
          
          if (event === 'SIGNED_IN') {
            logSecurityEvent('user_signed_in').catch(console.error);
          }
        } else {
          setProfile(null);
          setAdminUser(null);
          
          if (event === 'SIGNED_OUT') {
            logSecurityEvent('user_signed_out').catch(console.error);
          }
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error.message);
        logSecurityEvent('failed_sign_in_attempt', 'auth', null, { email, error: error.message }).catch(console.error);
      } else {
        console.log('Sign in successful for user:', data.user?.id);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      logSecurityEvent('failed_sign_in_attempt', 'auth', null, { email, error: 'Unknown error' }).catch(console.error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      console.log('Attempting sign up for:', email, 'with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        logSecurityEvent('failed_sign_up_attempt', 'auth', null, { email, error: error.message }).catch(console.error);
      } else {
        console.log('Sign up successful for:', email);
        logSecurityEvent('successful_sign_up', 'auth', null, { email }).catch(console.error);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign up exception:', error);
      logSecurityEvent('failed_sign_up_attempt', 'auth', null, { email, error: 'Unknown error' }).catch(console.error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      setLoading(true);
      
      logSecurityEvent('user_sign_out_initiated').catch(console.error);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
      
      // Clear state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setAdminUser(null);
      
    } catch (error) {
      console.error('Sign out exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    if (!profile) {
      console.log('No profile available for role check');
      return false;
    }
    const roleHierarchy = { speler: 1, organisator: 2, beheerder: 3 };
    const userLevel = roleHierarchy[profile.role] || 0;
    const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
    const hasAccess = userLevel >= requiredLevel;
    console.log(`Role check: user=${profile.role} (${userLevel}), required=${role} (${requiredLevel}), access=${hasAccess}`);
    return hasAccess;
  };

  const isSuperAdmin = () => {
    const isSuper = adminUser?.is_super_admin === true;
    console.log('Super admin check:', isSuper);
    return isSuper;
  };

  const contextValue = {
    user,
    profile,
    adminUser,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isSuperAdmin,
    logSecurityEvent
  };

  console.log('AuthProvider render - user:', user?.id, 'loading:', loading, 'profile:', profile?.role);

  return (
    <AuthContext.Provider value={contextValue}>
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
