
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedPasswordSecurity } from './useAdvancedPasswordSecurity';
import { useEnhancedSecurity } from './useEnhancedSecurity';

export const usePasswordSecurity = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { validatePasswordSecurity } = useAdvancedPasswordSecurity();
  const { logSecurityEventEnhanced } = useEnhancedSecurity();

  const updatePassword = async (newPassword: string, requireCurrentPassword: boolean = true) => {
    setLoading(true);
    
    try {
      const validation = validatePasswordSecurity(newPassword);
      if (!validation.isValid) {
        toast({
          title: "Wachtwoord voldoet niet aan eisen",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return { error: new Error(validation.errors.join(', ')) };
      }

      // Log password change attempt
      await logSecurityEventEnhanced(
        'password_change_attempt',
        'auth',
        null,
        {
          password_strength_score: validation.strength.score,
          timestamp: new Date().toISOString()
        },
        'medium'
      );

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        await logSecurityEventEnhanced(
          'password_change_failed',
          'auth',
          null,
          {
            error: error.message,
            timestamp: new Date().toISOString()
          },
          'high'
        );
        
        toast({
          title: "Wachtwoord update mislukt",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Log successful password change
      await logSecurityEventEnhanced(
        'password_changed_successfully',
        'auth',
        null,
        {
          password_strength_score: validation.strength.score,
          timestamp: new Date().toISOString()
        },
        'medium'
      );

      toast({
        title: "Wachtwoord succesvol gewijzigd!",
        description: "Je kunt nu inloggen met je nieuwe wachtwoord.",
      });

      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden';
      
      await logSecurityEventEnhanced(
        'password_change_exception',
        'auth',
        null,
        {
          error: errorMessage,
          timestamp: new Date().toISOString()
        },
        'high'
      );
      
      toast({
        title: "Wachtwoord update mislukt",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    return validatePasswordSecurity(password);
  };

  return {
    updatePassword,
    validatePassword,
    loading
  };
};
