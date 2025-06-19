
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const usePostResetCleanup = (resetCompleted: boolean) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!resetCompleted) return;

    console.log('Setting up auth listener for post-reset cleanup');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change after reset:', event);
      
      // Only redirect on sign out after password reset is completed
      if (event === 'SIGNED_OUT') {
        console.log('User signed out after password reset, redirecting to login');
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resetCompleted, navigate]);
};
