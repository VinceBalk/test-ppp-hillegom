
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/utils/inputSanitization';

export const usePasswordResetForm = (isValidLink: boolean) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const { toast } = useToast();
  const { updatePassword, loading, validatePassword } = usePasswordSecurity();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    if (!isValidLink) {
      toast({
        title: "Ongeldige sessie",
        description: "De reset link is niet geldig. Vraag een nieuwe aan.",
        variant: "destructive",
      });
      setIsResetting(false);
      return;
    }

    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);

    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        title: "Wachtwoorden komen niet overeen",
        description: "Controleer of beide wachtwoorden identiek zijn.",
        variant: "destructive",
      });
      setIsResetting(false);
      return;
    }

    const validation = validatePassword(sanitizedPassword);
    if (!validation.isValid) {
      toast({
        title: "Wachtwoord voldoet niet aan eisen",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      setIsResetting(false);
      return;
    }

    const { error } = await updatePassword(sanitizedPassword, false);
    
    if (!error) {
      setResetCompleted(true);
      // Give user time to see success message before signing out
      setTimeout(async () => {
        console.log('Password reset successful, signing out user');
        await supabase.auth.signOut();
      }, 2000);
    }
    
    setIsResetting(false);
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isResetting,
    resetCompleted,
    loading,
    handleResetPassword
  };
};
