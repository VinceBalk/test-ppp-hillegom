import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail } from 'lucide-react';

export function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  console.log('=== LOGIN FORM RENDERING ===');
  const { signIn, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Sending magic link to:', magicLinkEmail);
      const { error } = await signInWithMagicLink(magicLinkEmail);
      
      if (error) {
        console.error('Magic link error:', error);
        toast({
          title: 'Fout bij verzenden magic link',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Magic link verzonden!',
          description: 'Check je email voor de inloglink.',
        });
        setMagicLinkEmail('');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: 'Fout bij verzenden magic link',
        description: 'Er is een onverwachte fout opgetreden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="password">Wachtwoord</TabsTrigger>
        <TabsTrigger value="magiclink">Magic Link</TabsTrigger>
      </TabsList>

      <TabsContent value="password" className="space-y-4">
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
      </TabsContent>

      <TabsContent value="magiclink" className="space-y-4">
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <Label htmlFor="magic-email">E-mailadres</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="magic-email"
                type="email" 
                value={magicLinkEmail} 
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                maxLength={254}
                required 
                disabled={loading}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              We sturen je een link waarmee je direct kunt inloggen zonder wachtwoord.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Verzenden...' : 'Stuur Magic Link'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
