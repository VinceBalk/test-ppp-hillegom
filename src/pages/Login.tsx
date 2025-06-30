import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await login(email, password);

    if (error) {
      setError(error.message || 'Er is iets misgegaan.');
    } else {
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <main className="section stack-l" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <div className="stack-l" style={{ maxWidth: '40rem', margin: '0 auto' }}>
        <h1 className="h1 text-center">Inloggen</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="icon-s" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="stack-m">
          <div className="stack-s">
            <label htmlFor="email" className="text-m font-medium">E-mailadres</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="stack-s">
            <label htmlFor="password" className="text-m font-medium">Wachtwoord</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Even geduld...' : 'Inloggen'}
          </Button>
        </form>

        <p className="text-s text-center text-muted-foreground">
          Wachtwoord vergeten? <a href="/reset-password">Reset hier</a>
        </p>
      </div>
    </main>
  );
}
