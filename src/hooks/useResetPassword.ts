import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { sanitizeInput } from '@/utils/inputSanitization';

export const useResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidLink, setIsValidLink] = useState(false);
  const [linkValidated, setLinkValidated] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword, loading, validatePassword } = usePasswordSecurity();

  // Get parameters from URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    console.log('Reset password page loaded with params:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      type: type,
      accessTokenLength: accessToken?.length || 0
    });

    const validateResetLink = async () => {
      // Validate the link parameters
      if (type !== 'recovery') {
        console.error('Invalid type parameter:', type);
        toast({
          title: "Ongeldige reset link",
          description: "Deze link is niet bedoeld voor wachtwoord reset. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!accessToken) {
        console.error('Missing access_token parameter');
        toast({
          title: "Ongeldige reset link",
          description: "De reset link is onvolledig (access token ontbreekt). Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Check if access token looks valid (should be much longer than a few digits)
      if (accessToken.length < 20) {
        console.error('Invalid access_token format - too short:', accessToken.length);
        toast({
          title: "Ongeldige reset link",
          description: "De reset link is beschadigd. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!refreshToken) {
        console.error('Missing refresh_token parameter');
        toast({
          title: "Ongeldige reset link",  
          description: "De reset link is onvolledig (refresh token ontbreekt). Dit kan komen door een verkeerd geconfigureerde email template in Supabase. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // If we get here, the link has all required parameters
      try {
        console.log('Setting session with tokens...');
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          toast({
            title: "Sessie fout",
            description: `Probleem met de reset link: ${error.message}. Vraag een nieuwe aan.`,
            variant: "destructive",
          });
          setTimeout(() => navigate('/login'), 3000);
        } else {
          console.log('Session set successfully');
          setIsValidLink(true);
          toast({
            title: "Reset link geldig",
            description: "Je kunt nu een nieuw wachtwoord instellen.",
          });
        }
      } catch (error) {
        console.error('Session setup error:', error);
        toast({
          title: "Sessie fout",
          description: "Er is een probleem opgetreden. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLinkValidated(true);
      }
    };

    validateResetLink();
  }, [accessToken, refreshToken, type, navigate, toast]);

  // Only set up auth listener after successful password reset to handle sign out
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
    isValidLink,
    linkValidated,
    isResetting,
    loading,
    handleResetPassword,
    navigate
  };
};
