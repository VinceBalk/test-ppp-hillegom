
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Matches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  
  const { tournaments } = useTournaments();
  const { matches, isLoading, error } = useMatches(selectedTournamentId || undefined);

  // Update URL when tournament selection changes
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
    } else {
      setSearchParams({});
    }
  }, [selectedTournamentId, setSearchParams]);

  console.log('Matches page - Selected tournament:', selectedTournamentId);
  console.log('Matches data:', matches);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Gepland</Badge>;
      case 'in_progress':
        return <Badge variant="default">Bezig</Badge>;
      case 'completed':
        return <Badge variant="secondary">Voltooid</Badge>;
      default:
        return <Badge variant="outline">{status || 'Onbekend'}</Badge>;
    }
  };

  const getPlayerNames = (match: any) => {
    console.log('Getting player names for match:', match);
    
    if (match.player1 && match.player2) {
      return `${match.player1.name} vs ${match.player2.name}`;
    }
    if (match.team1_player1 && match.team2_player1) {
      const team1 = match.team1_player2 
        ? `${match.team1_player1.name} & ${match.team1_player2.name}`
        : match.team1_player1.name;
      const team2 = match.team2_player2
        ? `${match.team2_player1.name} & ${match.team2_player2.name}`
        : match.team2_player1.name;
      return `${team1} vs ${team2}`;
    }
    return 'Spelers nog niet toegewezen';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">
            Overzicht van alle wedstrijden en resultaten
          </p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">
            Overzicht van alle wedstrijden en resultaten
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Er is een fout opgetreden bij het laden van de wedstrijden: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">
            Overzicht van alle wedstrijden en resultaten
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Vernieuwen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter op Toernooi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecteer een toernooi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle toernooien</SelectItem>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTournament && (
              <Badge variant="outline">
                {selectedTournament.name} - Status: {selectedTournament.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTournamentId && matches.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nog geen wedstrijden gepland voor dit toernooi. 
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto"
              onClick={() => window.location.href = `/schedule/${selectedTournamentId}`}
            >
              Ga naar Planning om een schema te genereren
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {matches.length === 0 && !selectedTournamentId ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Selecteer een toernooi om wedstrijden te bekijken.
              </p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {getPlayerNames(match)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(match.status)}
                    <Badge variant="secondary" className="text-xs">
                      ID: {match.id.slice(0, 8)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{match.tournament?.name || 'Onbekend toernooi'}</span>
                  <span>•</span>
                  <span>Ronde {match.round_number}</span>
                  {match.created_at && (
                    <>
                      <span>•</span>
                      <span>Aangemaakt: {new Date(match.created_at).toLocaleDateString('nl-NL')}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {match.match_date && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(match.match_date).toLocaleDateString('nl-NL')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(match.match_date).toLocaleTimeString('nl-NL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </>
                  )}
                  {(match.court?.name || match.court_number) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {match.court?.name || `Baan ${match.court_number}`}
                    </div>
                  )}
                  {!match.match_date && !match.court?.name && !match.court_number && (
                    <span className="text-muted-foreground">Nog geen tijd/locatie toegewezen</span>
                  )}
                </div>
                
                {match.status === 'completed' && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Uitslag:</div>
                    <div className="text-lg">
                      {match.player1_score !== undefined && match.player2_score !== undefined
                        ? `${match.player1_score} - ${match.player2_score}`
                        : match.team1_score !== undefined && match.team2_score !== undefined
                        ? `${match.team1_score} - ${match.team2_score}`
                        : 'Geen score'}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                  {match.status === 'scheduled' && (
                    <Button variant="outline" size="sm">
                      Score Invoeren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {matches.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {matches.length} wedstrijd{matches.length !== 1 ? 'en' : ''} gevonden
          {selectedTournament && ` voor ${selectedTournament.name}`}
        </div>
      )}
    </div>
  );
}
