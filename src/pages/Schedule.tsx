
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useCourts } from '@/hooks/useCourts';
import { Badge } from '@/components/ui/badge';

export default function Schedule() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { tournaments } = useTournaments();
  const { courts } = useCourts();
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const currentTournament = tournamentId 
    ? tournaments.find(t => t.id === tournamentId)
    : tournaments.find(t => selectedTournament === t.id);

  const handleCreateSchedule = () => {
    if (currentTournament) {
      // TODO: Implement schedule generation logic
      console.log('Creating schedule for tournament:', currentTournament.name);
    }
  };

  const handleTournamentSelect = (tournament: any) => {
    setSelectedTournament(tournament.id);
    navigate(`/schedule/${tournament.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
        <p className="text-muted-foreground">
          Wedstrijd planning en speelschema beheer
        </p>
      </div>

      {!currentTournament ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecteer een Toernooi</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schema voor {currentTournament.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Max spelers: {currentTournament.max_players}
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
                    {currentTournament.status === 'open' ? 'Open' : 'Bezig'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4">
                <Button onClick={handleCreateSchedule}>
                  Schema Genereren
                </Button>
                <Button variant="outline" onClick={() => navigate('/matches')}>
                  Wedstrijden Bekijken
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beschikbare Banen</CardTitle>
            </CardHeader>
            <CardContent>
              {courts.length === 0 ? (
                <p className="text-muted-foreground">
                  Geen banen beschikbaar. 
                  <Button variant="link" onClick={() => navigate('/courts')} className="p-0 ml-1">
                    Voeg banen toe
                  </Button>
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {courts.filter(court => court.is_active).map((court) => (
                    <div 
                      key={court.id} 
                      className="p-3 border rounded-lg"
                      style={{ backgroundColor: court.background_color || '#f3f4f6' }}
                    >
                      <span className="font-medium">{court.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
