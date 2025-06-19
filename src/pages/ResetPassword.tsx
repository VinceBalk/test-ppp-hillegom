
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get parameters from URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    console.log('Reset password page loaded with params:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      type: type,
      fullUrl: window.location.href
    });

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

    if (!refreshToken) {
      console.error('Missing refresh_token parameter');
      toast({
        title: "Ongeldige reset link",  
        description: "De reset link is onvolledig (refresh token ontbreekt). Dit kan komen door een verkeerd geconfigureerde email template in Supabase.",
        variant: "destructive",
      });
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // If we get here, the link has all required parameters
    setIsValidLink(true);
    
    // Set the session with the tokens from the URL
    const setSession = async () => {
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
          console.log('Session set successfully:', data);
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
      }
    };

    setSession();
  }, [accessToken, refreshToken, type, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidLink) {
      toast({
        title: "Ongeldige sessie",
        description: "De reset link is niet geldig. Vraag een nieuwe aan.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Wachtwoorden komen niet overeen",
        description: "Controleer of beide wachtwoorden identiek zijn.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Wachtwoord te kort",
        description: "Het wachtwoord moet minimaal 6 karakters lang zijn.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Updating password...');
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: "Wachtwoord update mislukt",
          description: error.message || "Er is een fout opgetreden bij het updaten van je wachtwoord.",
          variant: "destructive",
        });
      } else {
        console.log('Password updated successfully');
        toast({
          title: "Wachtwoord succesvol gewijzigd!",
          description: "Je kunt nu inloggen met je nieuwe wachtwoord.",
        });
        
        // Sign out to force re-login with new password
        await supabase.auth.signOut();
        navigate('/login');
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Wachtwoord update mislukt",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating the link
  if (!isValidLink && type === 'recovery' && accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
        <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">PPP</span>
            </div>
            <CardTitle className="text-2xl font-bold">Reset link valideren...</CardTitle>
            <CardDescription className="text-base">
              Even geduld terwijl we je reset link controleren
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">PPP</span>
          </div>
          <CardTitle className="text-2xl font-bold">Nieuw wachtwoord instellen</CardTitle>
          <CardDescription className="text-base">
            Kies een nieuw wachtwoord voor je account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nieuw wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium gradient-primary"
              disabled={loading || !isValidLink}
            >
              {loading ? 'Bezig met opslaan...' : 'Wachtwoord opslaan'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Terug naar inloggen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
