
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeEmail } from '@/utils/inputSanitization';

export function SignUpForm() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
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
  );
}
