import { createContext, useContext, useEffect, ReactNode } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthService } from '@/hooks/useAuthService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logSecurityEvent } from '@/utils/securityLogger';
import { hasRole, isSuperAdmin } from '@/utils/roleUtils';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('=== AUTHPROVIDER INITIALIZING START ===');
  const authService = useAuthService();
  const userProfile = useUserProfile();

  const { user, session, loading, signIn, signUp, signOut, signInWithMagicLink, setUser, setSession, setLoading } = authService;
  const { profile, adminUser, fetchUserProfile, fetchAdminUser, clearProfile } = userProfile;

  console.log('AuthProvider render state BEFORE useEffect:', {
    user: user?.email || 'No user',
    loading,
    profile: profile?.role || 'No profile',
    adminUser: adminUser?.is_super_admin || 'No admin data'
  });

  useEffect(() => {
    console.log('=== AuthProvider initializing ===');
    
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session fetch error:', error);
        }
        
        console.log('Initial session check:', session ? `User: ${session.user?.email}` : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only fetch profile data if we have a user
        if (session?.user) {
          console.log('Fetching user profile for:', session.user.email);
          // Use setTimeout to defer these calls and prevent blocking
          setTimeout(() => {
            fetchUserProfile(session.user.id).catch(console.error);
            fetchAdminUser(session.user.id).catch(console.error);
          }, 0);
        } else {
          console.log('No session found, clearing profile');
          clearProfile();
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
        console.log('=== Auth initialization complete ===');
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
      if (import.meta.env.DEV) {
        console.log('=== Auth state changed ===');
        console.log('Event:', event);
      }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to avoid blocking the auth state change
          setTimeout(() => {
            fetchUserProfile(session.user.id).catch(console.error);
            fetchAdminUser(session.user.id).catch(console.error);
          }, 0);
          
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              logSecurityEvent(session.user.id, 'user_signed_in').catch(console.error);
            }, 100);
          }
        } else {
          clearProfile();
          
          if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              logSecurityEvent(user?.id, 'user_signed_out').catch(console.error);
            }, 100);
          }
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in with security logging
  const enhancedSignIn = async (email: string, password: string) => {
    console.log('=== Enhanced sign in attempt for:', email);
    const result = await signIn(email, password);
    
    if (result.error) {
      console.error('Sign in failed:', result.error.message);
      setTimeout(() => {
        logSecurityEvent(user?.id, 'failed_sign_in_attempt', 'auth', null, { email, error: result.error.message }).catch(console.error);
      }, 100);
    } else {
      console.log('Sign in successful for:', email);
    }
    
    return result;
  };

  // Enhanced sign up with security logging
  const enhancedSignUp = async (email: string, password: string) => {
    const result = await signUp(email, password);
    
    if (result.error) {
      setTimeout(() => {
        logSecurityEvent(user?.id, 'failed_sign_up_attempt', 'auth', null, { email, error: result.error.message }).catch(console.error);
      }, 100);
    } else {
      setTimeout(() => {
        logSecurityEvent(user?.id, 'successful_sign_up', 'auth', null, { email }).catch(console.error);
      }, 100);
    }
    
    return result;
  };

  // Enhanced sign out with security logging
  const enhancedSignOut = async () => {
    setTimeout(() => {
      logSecurityEvent(user?.id, 'user_sign_out_initiated').catch(console.error);
    }, 0);
    
    await signOut();
    clearProfile();
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    adminUser,
    session,
    loading,
    signIn: enhancedSignIn,
    signUp: enhancedSignUp,
    signInWithMagicLink,
    signOut: enhancedSignOut,
    hasRole: (role: string) => hasRole(profile, role),
    isSuperAdmin: () => isSuperAdmin(adminUser),
    logSecurityEvent: (action: string, resourceType?: string, resourceId?: string, details?: any) => 
      logSecurityEvent(user?.id, action, resourceType, resourceId, details)
  };

  console.log('AuthProvider render state:', {
    user: user?.email || 'No user',
    loading,
    profile: profile?.role || 'No profile',
    adminUser: adminUser?.is_super_admin || 'No admin data'
  });

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