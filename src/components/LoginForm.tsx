// LoginForm.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeEmail } from '@/utils/inputSanitization';

export function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedEmail || password.length < 6) {
      toast({
        title: 'Ongeldige invoer',
        description: 'Controleer je e-mail en wachtwoord.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error } = await signIn(sanitizedEmail, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Inloggen mislukt',
        description: error.message || 'E-mail of wachtwoord is onjuist.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <Label>E-mailadres</Label>
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <Label>Wachtwoord</Label>
      <div className="relative">
        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="button" className="absolute right-2 top-2 text-sm" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? 'Verberg' : 'Toon'}
        </button>
      </div>

      <div className="text-sm text-right">
        <button type="button" onClick={onForgotPassword} className="text-primary underline">
          Wachtwoord vergeten?
        </button>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Bezig...' : 'Inloggen'}
      </Button>
    </form>
  );
}
