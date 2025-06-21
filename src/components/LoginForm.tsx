
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } = '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimiting } from '@/hooks/useRateLimiting';
import { useInputSanitization } from '@/hooks/useInputSanitization';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';

export function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { isBlocked, checkRateLimit, logLoginAttempt } = useRateLimiting();
  const { sanitizeInput, validateInput } = useInputSanitization();
  const { logHighRiskActivity } = useEnhancedSecurity();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sanitize and validate input
      const sanitizedEmail = sanitizeInput(email.trim(), 'email');
      
      if (!validateInput(sanitizedEmail, 'email')) {
        toast({
          title: 'Ongeldige invoer',
          description: 'Voer een geldig e-mailadres in.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (password.length < 6 || password.length > 128) {
        toast({
          title: 'Ongeldig wachtwoord',
          description: 'Wachtwoord moet tussen 6 en 128 karakters lang zijn.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check rate limiting
      const isAllowed = await checkRateLimit(sanitizedEmail);
      if (!isAllowed) {
        setLoading(false);
        return;
      }

      // Log suspicious activity for very long passwords or unusual characters
      if (password.length > 64 || /[^\x20-\x7E]/.test(password)) {
        logHighRiskActivity('suspicious_login_attempt', {
          email: sanitizedEmail,
          password_length: password.length,
          has_unusual_chars: /[^\x20-\x7E]/.test(password)
        });
      }

      const { error } = await signIn(sanitizedEmail, password);
      
      // Log the attempt
      await logLoginAttempt(sanitizedEmail, !error);
      
      if (error) {
        toast({
          title: 'Inloggen mislukt',
          description: 'E-mail of wachtwoord is onjuist.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Fout bij inloggen',
        description: 'Er is een onverwachte fout opgetreden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mailadres</Label>
        <Input 
          id="email"
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          required 
          disabled={loading || isBlocked}
        />
      </div>

      <div>
        <Label htmlFor="password">Wachtwoord</Label>
        <div className="relative">
          <Input 
            id="password"
            type={showPassword ? 'text' : 'password'} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            maxLength={128}
            required 
            disabled={loading || isBlocked}
          />
          <button 
            type="button" 
            className="absolute right-2 top-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading || isBlocked}
          >
            {showPassword ? 'Verberg' : 'Toon'}
          </button>
        </div>
      </div>

      <div className="text-sm text-right">
        <button 
          type="button" 
          onClick={onForgotPassword} 
          className="text-primary underline hover:no-underline"
          disabled={loading || isBlocked}
        >
          Wachtwoord vergeten?
        </button>
      </div>

      <Button 
        type="submit" 
        disabled={loading || isBlocked} 
        className="w-full"
      >
        {loading ? 'Bezig met inloggen...' : 'Inloggen'}
      </Button>
      
      {isBlocked && (
        <p className="text-sm text-destructive text-center">
          Te veel mislukte pogingen. Probeer het over 15 minuten opnieuw.
        </p>
      )}
    </form>
  );
}
