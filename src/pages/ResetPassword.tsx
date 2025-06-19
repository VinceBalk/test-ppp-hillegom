
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get the access_token and refresh_token from URL parameters
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    console.log('Reset password page loaded with params:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      type: type
    });

    // Check if we have the required parameters for password reset
    if (type !== 'recovery') {
      toast({
        title: "Ongeldige reset link",
        description: "Deze link is niet geldig voor wachtwoord reset.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!accessToken || !refreshToken) {
      toast({
        title: "Ongeldige reset link",
        description: "De reset link is ongeldig of verlopen. Vraag een nieuwe aan.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Set the session with the tokens from the URL
    const setSession = async () => {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          toast({
            title: "Sessie fout",
            description: "Er is een probleem met de reset link. Vraag een nieuwe aan.",
            variant: "destructive",
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Session setup error:', error);
        toast({
          title: "Sessie fout",
          description: "Er is een probleem opgetreden. Vraag een nieuwe reset link aan.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    setSession();
  }, [accessToken, refreshToken, type, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

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
              disabled={loading}
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
