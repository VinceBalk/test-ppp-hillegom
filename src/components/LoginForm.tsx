
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimiting } from '@/hooks/useRateLimiting';
import { useEnhancedInputValidation } from '@/hooks/useEnhancedInputValidation';
import { useComprehensiveSecurityMonitoring } from '@/hooks/useComprehensiveSecurityMonitoring';

export function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { isBlocked, checkRateLimit, logLoginAttempt } = useRateLimiting();
  const { validateAndSanitize } = useEnhancedInputValidation();
  const { logSecurityEvent, detectSuspiciousPatterns } = useComprehensiveSecurityMonitoring();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced input validation and sanitization
      const emailValidation = validateAndSanitize(email.trim(), 'email');
      const passwordValidation = validateAndSanitize(password, 'password');
      
      if (!emailValidation.isValid) {
        toast({
          title: 'Ongeldige invoer',
          description: emailValidation.errors.join(', '),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!passwordValidation.isValid) {
        toast({
          title: 'Ongeldig wachtwoord',
          description: passwordValidation.errors.join(', '),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const sanitizedEmail = emailValidation.sanitized;

      // Check for suspicious login patterns
      const suspiciousPatterns = await detectSuspiciousPatterns(sanitizedEmail);
      if (suspiciousPatterns?.is_suspicious) {
        await logSecurityEvent('suspicious_activity', 'suspicious_login_pattern_detected', 'authentication', null, {
          email: sanitizedEmail,
          patterns: suspiciousPatterns
        }, 'high');
        
        toast({
          title: 'Beveiligingswaarschuwing',
          description: 'Verdachte inlogactiviteit gedetecteerd. Probeer het later opnieuw.',
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

      // Log login attempt start
      await logSecurityEvent('login_attempt', 'login_attempt_started', 'authentication', null, {
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      }, 'low');

      const { error } = await signIn(sanitizedEmail, password);
      
      // Log the attempt result
      await logLoginAttempt(sanitizedEmail, !error);
      
      if (error) {
        await logSecurityEvent('login_attempt', 'login_failed', 'authentication', null, {
          email: sanitizedEmail,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }, 'medium');

        toast({
          title: 'Inloggen mislukt',
          description: 'E-mail of wachtwoord is onjuist.',
          variant: 'destructive',
        });
      } else {
        await logSecurityEvent('login_attempt', 'login_successful', 'authentication', null, {
          email: sanitizedEmail,
          timestamp: new Date().toISOString()
        }, 'low');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      await logSecurityEvent('system_event', 'login_exception', 'authentication', null, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 'high');

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
