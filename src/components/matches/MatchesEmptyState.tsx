
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MatchesEmptyStateProps {
  type: 'no-tournaments' | 'no-matches' | 'no-selection';
  selectedTournamentId?: string;
}

export default function MatchesEmptyState({ type, selectedTournamentId }: MatchesEmptyStateProps) {
  const navigate = useNavigate();

  if (type === 'no-tournaments') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nog geen toernooien aangemaakt.{' '}
          <Button 
            variant="link" 
            className="p-0 ml-1 h-auto"
            onClick={() => navigate('/tournaments')}
          >
            Ga naar Toernooien om een toernooi aan te maken
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (type === 'no-matches' && selectedTournamentId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nog geen wedstrijden gepland voor dit toernooi.{' '}
          <Button 
            variant="link" 
            className="p-0 ml-1 h-auto"
            onClick={() => navigate(`/schedule/${selectedTournamentId}`)}
          >
            Ga naar Planning om een schema te genereren
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="text-center py-8">
        <p className="text-muted-foreground">
          Selecteer een toernooi om wedstrijden te bekijken.
        </p>
      </CardContent>
    </Card>
  );
}
