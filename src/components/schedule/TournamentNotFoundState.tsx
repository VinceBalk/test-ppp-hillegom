
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TournamentNotFoundState() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
        <p className="text-muted-foreground">Genereer wedstrijdschema's voor toernooien</p>
      </div>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Toernooi niet gevonden.{' '}
          <Button 
            variant="link" 
            className="p-0 ml-1 h-auto"
            onClick={() => navigate('/tournaments')}
          >
            Ga terug naar toernooien
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
