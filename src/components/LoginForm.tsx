import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  console.log('=== LOGIN FORM RENDERING ===');
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting to sign in with:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
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
          disabled={loading}
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
      </div>

      <div className="text-sm text-right">
        <button 
          type="button" 
          onClick={onForgotPassword} 
          className="text-primary underline hover:no-underline"
          disabled={loading}
        >
          Wachtwoord vergeten?
        </button>
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full"
      >
        {loading ? 'Bezig met inloggen...' : 'Inloggen'}
      </Button>
    </form>
  );
}
