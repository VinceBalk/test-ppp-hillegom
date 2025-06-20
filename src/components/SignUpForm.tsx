
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
  const [confirmPassword, setConfirmPassword] = useState('');
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

      // Enhanced password validation
      if (password.length < 6) {
        toast({
          title: "Zwak wachtwoord",
          description: "Wachtwoord moet minimaal 6 karakters lang zijn.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Wachtwoorden komen niet overeen",
          description: "Controleer of beide wachtwoorden hetzelfde zijn.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Additional password strength validation
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        toast({
          title: "Zwak wachtwoord",
          description: "Wachtwoord moet een hoofdletter, kleine letter en cijfer bevatten.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await signUp(sanitizedEmail, password);
      
      if (error) {
        console.error('Sign up error:', error);
        let errorMessage = "Er is een fout opgetreden bij het registreren.";
        
        if (error.message?.includes('already registered')) {
          errorMessage = "Dit email adres is al geregistreerd. Probeer in te loggen.";
        } else if (error.message?.includes('invalid email')) {
          errorMessage = "Ongeldig email adres.";
        } else if (error.message?.includes('weak password')) {
          errorMessage = "Wachtwoord is te zwak. Gebruik een sterker wachtwoord.";
        }
        
        toast({
          title: "Registratie mislukt",
          description: errorMessage,
          variant: "destructive",
        });
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
          maxLength={254}
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
          maxLength={128}
        />
        <div className="text-xs text-muted-foreground">
          Minimaal 6 karakters met hoofdletter, kleine letter en cijfer
        </div>
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
          maxLength={128}
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
