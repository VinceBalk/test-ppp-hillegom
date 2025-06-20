
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeEmail } from '@/utils/inputSanitization';

interface LoginFormProps {
  onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
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
        onClick={onForgotPassword}
      >
        Wachtwoord vergeten?
      </Button>
    </form>
  );
}
