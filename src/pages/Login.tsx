
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast({
        title: "Welkom terug!",
        description: "Je bent succesvol ingelogd.",
      });
    } catch (error) {
      toast({
        title: "Login mislukt",
        description: "Controleer je email en wachtwoord.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">PPP</span>
          </div>
          <CardTitle className="text-2xl font-bold">PPP Hillegom</CardTitle>
          <CardDescription className="text-base">
            Padel toernooi management systeem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="je@email.com"
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
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
          </form>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Demo login: gebruik elk email adres<br />
              <span className="font-medium">vincebalk@gmail.com</span> voor admin toegang
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
