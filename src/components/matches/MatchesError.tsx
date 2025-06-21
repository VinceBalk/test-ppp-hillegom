
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MatchesErrorProps {
  error: Error;
  onRetry: () => void;
}

export default function MatchesError({ error, onRetry }: MatchesErrorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
        <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
      </div>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Er is een fout opgetreden bij het laden van de wedstrijden: {error.message}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={onRetry}
          >
            Probeer opnieuw
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
