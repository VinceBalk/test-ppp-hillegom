
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { updatePassword, loading, validatePassword } = usePasswordSecurity();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    if (!isValidLink) {
      toast({
        title: 'Ongeldige sessie',
        description: 'De reset link is niet geldig of verlopen. Vraag een nieuwe aan.',
        variant: 'destructive',
      });
      setIsResetting(false);
      return;
    }

    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);

    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        title: 'Wachtwoorden komen niet overeen',
        description: 'Controleer of beide wachtwoorden identiek zijn.',
        variant: 'destructive',
      });
      setIsResetting(false);
      return;
    }

    const validation = validatePassword(sanitizedPassword);
    if (!validation.isValid) {
      toast({
        title: 'Wachtwoord voldoet niet aan eisen',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      setIsResetting(false);
      return;
    }

    try {
      console.log('Starting password update...');
      const { error } = await supabase.auth.updateUser({
        password: sanitizedPassword
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: 'Wachtwoord niet gewijzigd',
          description: error.message || 'Er is een fout opgetreden. Probeer het opnieuw.',
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      console.log('Password updated successfully');
      toast({
        title: 'Wachtwoord gewijzigd',
        description: 'Je wachtwoord is succesvol gewijzigd. Je wordt nu uitgelogd.',
      });

      setResetCompleted(true);
      
      // Wacht even en log dan uit + redirect
      setTimeout(async () => {
        console.log('Signing out user and redirecting...');
        await supabase.auth.signOut();
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast({
        title: 'Wachtwoord niet gewijzigd',
        description: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isResetting,
    resetCompleted,
    loading,
    handleResetPassword,
  };
};
