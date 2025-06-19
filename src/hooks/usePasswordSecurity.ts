
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export const usePasswordSecurity = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('Wachtwoord moet minimaal 6 karakters lang zijn');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Wachtwoord moet minimaal één hoofdletter bevatten');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Wachtwoord moet minimaal één cijfer bevatten');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const updatePassword = async (newPassword: string, requireCurrentPassword = true) => {
    setLoading(true);
    
    try {
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        toast({
          title: "Wachtwoord voldoet niet aan eisen",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return { error: new Error(validation.errors.join(', ')) };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: "Wachtwoord update mislukt",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Wachtwoord succesvol gewijzigd!",
        description: "Je kunt nu inloggen met je nieuwe wachtwoord.",
      });

      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden';
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

  return {
    validatePassword,
    updatePassword,
    loading
  };
};
