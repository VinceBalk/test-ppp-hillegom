
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResetPasswordFormProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  isValidLink: boolean;
  loading: boolean;
  isResetting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

export default function ResetPasswordForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isValidLink,
  loading,
  isResetting,
  onSubmit,
  onBackToLogin
}: ResetPasswordFormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">PPP</span>
          </div>
          <CardTitle className="text-2xl font-bold">Nieuw wachtwoord instellen</CardTitle>
          <CardDescription className="text-base">
            Kies een nieuw wachtwoord voor je account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nieuw wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12"
                autoComplete="new-password"
              />
              <div className="text-sm text-muted-foreground">
                <p>Wachtwoord vereisten:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Minimaal 6 karakters</li>
                  <li>Minimaal één hoofdletter</li>
                  <li>Minimaal één cijfer</li>
                </ul>
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
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium gradient-primary"
              disabled={loading || !isValidLink || isResetting}
            >
              {loading || isResetting ? 'Bezig met opslaan...' : 'Wachtwoord opslaan'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBackToLogin}
              disabled={isResetting}
            >
              Terug naar inloggen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
