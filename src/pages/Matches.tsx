
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments } from '@/hooks/useTournaments';

export default function Matches() {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  
  const { tournaments } = useTournaments();
  const { matches, isLoading } = useMatches(selectedTournamentId || undefined);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Gepland</Badge>;
      case 'in_progress':
        return <Badge variant="default">Bezig</Badge>;
      case 'completed':
        return <Badge variant="secondary">Voltooid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlayerNames = (match: any) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
        <p className="text-muted-foreground">
          Overzicht van alle wedstrijden en resultaten
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter op Toernooi</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {selectedTournamentId 
                  ? 'Nog geen wedstrijden gepland voor dit toernooi.' 
                  : 'Nog geen wedstrijden gepland.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {getPlayerNames(match)}
                  </CardTitle>
                  {getStatusBadge(match.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {match.tournament?.name} - Ronde {match.round_number}
                </p>
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
    </div>
  );
}
