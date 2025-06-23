
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MatchesAuthGuardProps {
  children: React.ReactNode;
  user: any;
}

export default function MatchesAuthGuard({ children, user }: MatchesAuthGuardProps) {
  if (!user) {
    console.error('=== NO USER FOUND - AUTHENTICATION ISSUE ===');
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Geen gebruiker gevonden. Er lijkt een authenticatie probleem te zijn.
            Probeer opnieuw in te loggen.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
