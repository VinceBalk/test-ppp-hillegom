
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
        return;
      }

      console.log('User profile fetched:', data);
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
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

      if (error) {
        console.error('Error fetching admin user:', error);
        return;
      }

      console.log('Admin user fetched:', data);
      setAdminUser(data as AdminUser | null);
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  const logSecurityEvent = async (
    action: string, 
    resourceType?: string, 
    resourceId?: string, 
    details?: any
  ) => {
    try {
      await supabase.rpc('log_security_event', {
        p_user_id: user?.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'User:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          console.log('User authenticated, fetching profile and admin status...');
          // Fetch user profile and admin status after authentication
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchAdminUser(session.user.id);
          }, 0);

          // Log authentication events
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              logSecurityEvent('user_signed_in');
            }, 0);
          }
        } else {
          console.log('User signed out, clearing profile and admin status');
          setProfile(null);
          setAdminUser(null);
          if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              logSecurityEvent('user_signed_out');
            }, 0);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchAdminUser(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        await logSecurityEvent('failed_sign_in_attempt', 'auth', null, { email, error: error.message });
      }
      
      return { error };
    } catch (error) {
      await logSecurityEvent('failed_sign_in_attempt', 'auth', null, { email, error: 'Unknown error' });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        await logSecurityEvent('failed_sign_up_attempt', 'auth', null, { email, error: error.message });
      } else {
        await logSecurityEvent('successful_sign_up', 'auth', null, { email });
      }
      
      return { error };
    } catch (error) {
      await logSecurityEvent('failed_sign_up_attempt', 'auth', null, { email, error: 'Unknown error' });
      return { error };
    }
  };

  const signOut = async () => {
    await logSecurityEvent('user_sign_out_initiated');
    await supabase.auth.signOut();
    setProfile(null);
    setAdminUser(null);
  };

  const hasRole = (role: string) => {
    if (!profile) {
      console.log('hasRole check: no profile available');
      return false;
    }
    const roleHierarchy = { speler: 1, organisator: 2, beheerder: 3 };
    const userLevel = roleHierarchy[profile.role] || 0;
    const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
    const hasPermission = userLevel >= requiredLevel;
    console.log(`hasRole check: user role=${profile.role} (level ${userLevel}), required role=${role} (level ${requiredLevel}), has permission=${hasPermission}`);
    return hasPermission;
  };

  const isSuperAdmin = () => {
    const isSuper = adminUser?.is_super_admin === true;
    console.log('isSuperAdmin check:', isSuper, 'adminUser:', adminUser);
    return isSuper;
  };

  // Debug logging effect
  useEffect(() => {
    console.log('Auth state update:', {
      user: user?.email,
      profile: profile?.role,
      adminUser: adminUser?.is_super_admin,
      loading
    });
  }, [user, profile, adminUser, loading]);

  return (
    <AuthContext.Provider value={{
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
    }}>
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
