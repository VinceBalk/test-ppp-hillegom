// SignUpForm.tsx

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

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      toast({
        title: 'Ongeldig e-mailadres',
        description: 'Voer een geldig e-mailadres in.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Wachtwoorden verschillen',
        description: 'De wachtwoorden komen niet overeen.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Wachtwoord te kort',
        description: 'Gebruik minstens 6 tekens.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(sanitizedEmail, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Registratie mislukt',
        description: error.message || 'Er ging iets mis bij het registreren.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Registratie geslaagd',
        description: 'Controleer je inbox voor een bevestigingsmail.',
      });
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <Label>E-mailadres</Label>
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <Label>Wachtwoord</Label>
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

      <Label>Herhaal wachtwoord</Label>
      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Bezig...' : 'Registreren'}
      </Button>
    </form>
  );
}
