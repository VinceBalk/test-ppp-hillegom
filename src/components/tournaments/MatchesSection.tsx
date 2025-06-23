
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Match } from '@/hooks/useMatches';
import MatchCard from '@/components/matches/MatchCard';

interface MatchesSectionProps {
  matches: Match[];
  tournamentName: string;
  tournamentId: string;
  maxMatches?: number;
  isLoading?: boolean;
  error?: Error | null;
}

export default function MatchesSection({ 
  matches, 
  tournamentName, 
  tournamentId, 
  maxMatches = 5,
  isLoading = false,
  error = null
}: MatchesSectionProps) {
  const navigate = useNavigate();
  
  const displayMatches = maxMatches ? matches.slice(0, maxMatches) : matches;
  const hasMoreMatches = matches.length > maxMatches;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wedstrijden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Fout bij laden van wedstrijden: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wedstrijden voor {tournamentName}</CardTitle>
          {matches.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/matches?tournament=${tournamentId}`)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Alle wedstrijden
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{matches.length} wedstrijden gevonden</p>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground">
            Nog geen wedstrijden gepland voor dit toernooi.{' '}
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto"
              onClick={() => navigate(`/schedule/${tournamentId}`)}
            >
              Ga naar Planning om een schema te genereren
            </Button>
          </p>
        ) : (
          <div className="space-y-3">
            {displayMatches.map((match, index) => (
              <MatchCard key={match.id} match={match} matchNumberInCourtRound={index + 1} />
            ))}
            {hasMoreMatches && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/matches?tournament=${tournamentId}`)}
                >
                  Bekijk alle {matches.length} wedstrijden
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
