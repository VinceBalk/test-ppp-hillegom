
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useInputSanitization } from '@/hooks/useInputSanitization';
import { useAdvancedPasswordSecurity } from '@/hooks/useAdvancedPasswordSecurity';
import { useEnhancedSecurity } from '@/hooks/useEnhancedSecurity';

export function SignUpForm() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { sanitizeInput, validateInput } = useInputSanitization();
  const { validatePasswordSecurity } = useAdvancedPasswordSecurity();
  const { logHighRiskActivity } = useEnhancedSecurity();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sanitize and validate email
      const sanitizedEmail = sanitizeInput(email.trim(), 'email');
      
      if (!validateInput(sanitizedEmail, 'email')) {
        toast({
          title: 'Ongeldig e-mailadres',
          description: 'Voer een geldig e-mailadres in.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Validate password security
      const passwordValidation = validatePasswordSecurity(password, confirmPassword);
      
      if (!passwordValidation.isValid) {
        toast({
          title: 'Wachtwoord voldoet niet aan eisen',
          description: passwordValidation.errors.join(', '),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Log suspicious signup attempts
      if (password.length > 64 || /[^\x20-\x7E]/.test(password)) {
        logHighRiskActivity('suspicious_signup_attempt', {
          email: sanitizedEmail,
          password_length: password.length,
          has_unusual_chars: /[^\x20-\x7E]/.test(password)
        });
      }

      const { error } = await signUp(sanitizedEmail, password);
      
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
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Fout bij registreren',
        description: 'Er is een onverwachte fout opgetreden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = validatePasswordSecurity(password);

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="signup-email">E-mailadres</Label>
        <Input 
          id="signup-email"
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          required 
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="signup-password">Wachtwoord</Label>
        <div className="relative">
          <Input 
            id="signup-password"
            type={showPassword ? 'text' : 'password'} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            maxLength={128}
            required 
            disabled={loading}
          />
          <button 
            type="button" 
            className="absolute right-2 top-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? 'Verberg' : 'Toon'}
          </button>
        </div>
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    passwordStrength.strength.score <= 2 ? 'bg-red-500' :
                    passwordStrength.strength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.strength.score / 6) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {passwordStrength.strength.score <= 2 ? 'Zwak' :
                 passwordStrength.strength.score <= 4 ? 'Gemiddeld' : 'Sterk'}
              </span>
            </div>
            {passwordStrength.strength.feedback.length > 0 && (
              <ul className="text-xs text-muted-foreground mt-1">
                {passwordStrength.strength.feedback.map((feedback, index) => (
                  <li key={index}>• {feedback}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="confirm-password">Herhaal wachtwoord</Label>
        <Input 
          id="confirm-password"
          type={showPassword ? 'text' : 'password'} 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
          maxLength={128}
          required 
          disabled={loading}
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading || !passwordStrength.strength.isStrong} 
        className="w-full"
      >
        {loading ? 'Bezig met registreren...' : 'Registreren'}
      </Button>
    </form>
  );
}
