
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthService } from '@/hooks/useAuthService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logSecurityEvent } from '@/utils/securityLogger';
import { hasRole, isSuperAdmin } from '@/utils/roleUtils';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authService = useAuthService();
  const userProfile = useUserProfile();

  const { user, session, loading, signIn, signUp, signOut, setUser, setSession, setLoading } = authService;
  const { profile, adminUser, fetchUserProfile, fetchAdminUser, clearProfile } = userProfile;

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session fetch error:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to prevent blocking
        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).catch(console.error);
              fetchAdminUser(session.user.id).catch(console.error);
            }
          }, 100);
        } else {
          clearProfile();
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to prevent race conditions
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).catch(console.error);
              fetchAdminUser(session.user.id).catch(console.error);
            }
          }, 100);
          
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              logSecurityEvent(session.user.id, 'user_signed_in').catch(console.error);
            }, 200);
          }
        } else {
          clearProfile();
          
          if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              logSecurityEvent(user?.id, 'user_signed_out').catch(console.error);
            }, 200);
          }
        }
      }
    );

    // Then initialize auth
    initializeAuth();

    return () => {
      mounted = false;
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
