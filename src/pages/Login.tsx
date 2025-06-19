import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail } from '@/utils/inputSanitization';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeEmail(email);
      if (!sanitizedEmail) {
        toast({
          title: "Ongeldig email adres",
          description: "Voer een geldig email adres in.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await signIn(sanitizedEmail, password);
      
      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Login mislukt",
          description: error.message || "Controleer je email en wachtwoord.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welkom terug!",
          description: "Je bent succesvol ingelogd.",
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Login mislukt",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeEmail(email);
      if (!sanitizedEmail) {
        toast({
          title: "Ongeldig email adres",
          description: "Voer een geldig email adres in.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await signUp(sanitizedEmail, password);
      
      if (error) {
        console.error('Sign up error:', error);
        if (error.message?.includes('already registered')) {
          toast({
            title: "Account bestaat al",
            description: "Dit email adres is al geregistreerd. Probeer in te loggen.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registratie mislukt",
            description: error.message || "Er is een fout opgetreden bij het registreren.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Registratie succesvol!",
          description: "Controleer je email voor een bevestigingslink.",
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Registratie mislukt",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      toast({
        title: "Email vereist",
        description: "Voer een geldig email adres in om je wachtwoord te resetten.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Reset mislukt",
          description: error.message || "Er is een fout opgetreden bij het resetten van je wachtwoord.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset link verzonden!",
          description: "Controleer je email voor een link om je wachtwoord te resetten. Let op: de link is 1 uur geldig.",
        });
        setShowResetForm(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset mislukt",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">PPP</span>
          </div>
          <CardTitle className="text-2xl font-bold">PPP Hillegom</CardTitle>
          <CardDescription className="text-base">
            Padel toernooi management systeem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetForm ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Wachtwoord vergeten?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Voer je email adres in om een reset link te ontvangen.
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="je@email.com"
                    required
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium gradient-primary"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Bezig met verzenden...' : 'Reset link verzenden'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetForm(false)}
                >
                  Terug naar inloggen
                </Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Inloggen</TabsTrigger>
                <TabsTrigger value="signup">Registreren</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="je@email.com"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Wachtwoord</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium gradient-primary"
                    disabled={loading}
                  >
                    {loading ? 'Bezig met inloggen...' : 'Inloggen'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => setShowResetForm(true)}
                  >
                    Wachtwoord vergeten?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="je@email.com"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Wachtwoord</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    {loading ? 'Bezig met registreren...' : 'Registreren'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
