
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRateLimiting = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  const checkRateLimit = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_login_rate_limit', {
        p_email: email
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow login if check fails
      }

      if (!data) {
        setIsBlocked(true);
        toast({
          title: "Te veel pogingen",
          description: "Je hebt te vaak gefaald in te loggen. Probeer het over 15 minuten opnieuw.",
          variant: "destructive",
        });
        return false;
      }

      setIsBlocked(false);
      return true;
    } catch (error) {
      console.error('Rate limit check exception:', error);
      return true; // Allow login if check fails
    }
  };

  const logLoginAttempt = async (email: string, success: boolean) => {
    try {
      await supabase.rpc('log_login_attempt', {
        p_email: email,
        p_success: success
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  };

  return {
    isBlocked,
    checkRateLimit,
    logLoginAttempt
  };
};
