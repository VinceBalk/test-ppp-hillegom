
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useResetLinkValidation = () => {
  const [isValidLink, setIsValidLink] = useState(false);
  const [linkValidated, setLinkValidated] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get parameters from URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');
  const token = searchParams.get('token'); // voor de nieuwe link format

  useEffect(() => {
    console.log('Reset password page loaded with params:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      token: token ? 'present' : 'missing',
      type: type
    });

    const validateResetLink = async () => {
      // Check voor nieuwe link format (met alleen token parameter)
      if (token && type === 'recovery') {
        console.log('Using new token format');
        try {
          // Verwerk de token via de Supabase verify endpoint
          const response = await fetch(`https://bkubwrtneoraktuwopuy.supabase.co/auth/v1/verify?token=${token}&type=recovery&redirect_to=${window.location.origin}/reset-password`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            // Check of we nu een geldige sessie hebben
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (session && !error) {
              console.log('Session established successfully');
              setIsValidLink(true);
              toast({
                title: "Reset link geldig",
                description: "Je kunt nu een nieuw wachtwoord instellen.",
              });
            } else {
              console.error('No session after token verification');
              setIsValidLink(false);
              toast({
                title: "Sessie probleem",
                description: "Er is een probleem met de reset link. Vraag een nieuwe aan.",
                variant: "destructive",
              });
              setTimeout(() => navigate('/login'), 3000);
            }
          } else {
            console.error('Token verification failed');
            setIsValidLink(false);
            toast({
              title: "Ongeldige reset link",
              description: "De reset link is ongeldig of verlopen. Vraag een nieuwe aan.",
              variant: "destructive",
            });
            setTimeout(() => navigate('/login'), 3000);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          setIsValidLink(false);
          toast({
            title: "Verificatie fout",
            description: "Er is een probleem opgetreden bij het verifiëren van de link.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/login'), 3000);
        } finally {
          setLinkValidated(true);
        }
        return;
      }

      // Fallback naar oude method met access_token en refresh_token
      if (type !== 'recovery') {
        console.error('Invalid type parameter:', type);
        toast({
          title: "Ongeldige reset link",
          description: "Deze link is niet bedoeld voor wachtwoord reset. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        setLinkValidated(true);
        return;
      }

      if (!accessToken) {
        console.error('Missing access_token parameter');
        toast({
          title: "Ongeldige reset link",
          description: "De reset link is onvolledig. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        setLinkValidated(true);
        return;
      }

      if (!refreshToken) {
        console.error('Missing refresh_token parameter');
        toast({
          title: "Ongeldige reset link",  
          description: "De reset link is onvolledig. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
        setLinkValidated(true);
        return;
      }

      // Voor links met access_token en refresh_token
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
  }, [accessToken, refreshToken, type, token, navigate, toast]);

  return {
    isValidLink,
    linkValidated
  };
};
