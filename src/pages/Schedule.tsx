
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function Schedule() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  console.log('Schedule page loaded - Tournament ID:', tournamentId);
  console.log('Available tournaments:', tournaments);

  // Loading state
  if (tournamentsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (tournamentsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
          <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fout bij laden toernooien: {tournamentsError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Find current tournament
  const currentTournament = tournamentId && tournaments.length > 0
    ? tournaments.find(t => t.id === tournamentId)
    : tournaments.length > 0 && selectedTournament
    ? tournaments.find(t => selectedTournament === t.id)
    : null;

  const { tournamentPlayers = [], isLoading: playersLoading } = useTournamentPlayers(currentTournament?.id);

  const handleTournamentSelect = (tournament: any) => {
    setSelectedTournament(tournament.id);
    navigate(`/schedule/${tournament.id}`);
  };

  const canGenerateSchedule = currentTournament && tournamentPlayers.length >= 4;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
        <p className="text-muted-foreground">2v2 Wedstrijd planning en speelschema beheer</p>
      </div>

      {!currentTournament ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecteer een Toernooi</CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Geen toernooien gevonden. Maak eerst een toernooi aan.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tournaments
                  .filter(t => t.status === 'open' || t.status === 'in_progress')
                  .map((tournament) => (
                  <Card 
                    key={tournament.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTournamentSelect(tournament)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tournament.start_date} - {tournament.end_date}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {tournament.status === 'open' ? 'Open' : 'Bezig'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              2v2 Schema voor {currentTournament.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playersLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Spelers laden...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Spelers: {tournamentPlayers.length} / {currentTournament.max_players}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Ronde: {currentTournament.current_round || 1} van {currentTournament.total_rounds || 3}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentTournament.status === 'open' ? 'Open' : 
                       currentTournament.status === 'in_progress' ? 'Bezig' : 
                       currentTournament.status}
                    </Badge>
                  </div>
                </div>

                {!canGenerateSchedule && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Er moeten minimaal 4 spelers toegewezen zijn om 2v2 wedstrijden te genereren.
                      Momenteel zijn er {tournamentPlayers.length} spelers toegewezen.
                    </AlertDescription>
                  </Alert>
                )}

                {canGenerateSchedule && (
                  <Alert>
                    <AlertDescription>
                      <strong>2v2 Schema gereed voor generatie!</strong><br />
                      Links groep: {tournamentPlayers.filter(tp => tp.group === 'left').length} spelers<br />
                      Rechts groep: {tournamentPlayers.filter(tp => tp.group === 'right').length} spelers<br />
                      Je kunt nu 2v2 wedstrijden genereren.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex gap-4">
                  <Button 
                    onClick={() => console.log('Schema genereren voor:', currentTournament.name)}
                    disabled={!canGenerateSchedule}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    2v2 Schema Genereren
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/matches?tournament=${currentTournament.id}`)}
                  >
                    Wedstrijden Bekijken
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/tournaments/${currentTournament.id}/assign-players`)}
                  >
                    Spelers Beheren
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
