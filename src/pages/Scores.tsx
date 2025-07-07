import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trophy, Users, Calendar } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useMatches } from '@/hooks/useMatches';
import { supabase } from '@/integrations/supabase/client';

type MatchSpecial = {
  match_id: string;
  player_id: string;
  special_type_id: string;
  count: number;
};

type SpecialType = {
  id: string;
  name: string;
};

export default function Scores() {
  const navigate = useNavigate();
  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const { matches, isLoading: matchesLoading } = useMatches(selectedTournamentId || undefined);
  const [specialsPerMatch, setSpecialsPerMatch] = useState<Record<string, MatchSpecial[]>>({});
  const [specialTypes, setSpecialTypes] = useState<SpecialType[]>([]);

  const isLoading = tournamentsLoading || matchesLoading;

  useEffect(() => {
    const fetchSpecialTypes = async () => {
      const { data, error } = await supabase
        .from('special_types')
        .select('id, name')
        .eq('is_active', true);

      if (!error && data) setSpecialTypes(data);
    };

    fetchSpecialTypes();
  }, []);

  useEffect(() => {
    const fetchSpecialsForMatches = async () => {
      if (!matches?.length) return;
      const matchIds = matches.map((m) => m.id);
      const { data, error } = await supabase
        .from('match_specials')
        .select('match_id, player_id, special_type_id, count')
        .in('match_id', matchIds);

      if (!error && data) {
        const grouped: Record<string, MatchSpecial[]> = {};
        data.forEach((s) => {
          if (!grouped[s.match_id]) grouped[s.match_id] = [];
          grouped[s.match_id].push(s);
        });
        setSpecialsPerMatch(grouped);
      }
    };

    fetchSpecialsForMatches();
  }, [matches]);

  const completedMatches = matches.filter(match => match.status === 'completed');
  const activeTournaments = tournaments.filter(t => t.status === 'in_progress' || t.status === 'completed');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scores & Uitslagen</h1>
          <p className="text-muted-foreground">Bekijk de resultaten van alle toernooien</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Scores & Uitslagen</h1>
        <p className="text-muted-foreground">Bekijk de resultaten van alle toernooien</p>
      </div>

      {/* Tournament Selection */}
      {activeTournaments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeTournaments.map((tournament) => (
            <Card 
              key={tournament.id} 
              className={`cursor-pointer transition-colors ${
                selectedTournamentId === tournament.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedTournamentId(tournament.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5" />
                  {tournament.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(tournament.start_date).toLocaleDateString('nl-NL')} - {new Date(tournament.end_date).toLocaleDateString('nl-NL')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Status: {tournament.status === 'in_progress' ? 'Actief' : tournament.status === 'completed' ? 'Voltooid' : tournament.status}
                  </div>
                  {tournament.current_round && (
                    <div>Huidige ronde: {tournament.current_round}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Geen actieve of voltooide toernooien gevonden.{' '}
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto"
              onClick={() => navigate('/tournaments')}
            >
              Ga naar Toernooien om een toernooi aan te maken
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Scores Display */}
      {selectedTournamentId && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Uitslagen - {tournaments.find(t => t.id === selectedTournamentId)?.name}
          </h2>

          {completedMatches.length > 0 ? (
            <div className="grid gap-4">
              {completedMatches.map((match) => (
                <Card key={match.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {match.team1_player1?.name && match.team1_player2?.name ? (
                            `${match.team1_player1.name} & ${match.team1_player2.name}`
                          ) : match.player1?.name ? (
                            match.player1.name
                          ) : (
                            'Team 1'
                          )}
                          {' vs '}
                          {match.team2_player1?.name && match.team2_player2?.name ? (
                            `${match.team2_player1.name} & ${match.team2_player2.name}`
                          ) : match.player2?.name ? (
                            match.player2.name
                          ) : (
                            'Team 2'
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Ronde {match.round_number} • {match.court?.name || `Baan ${match.court_number}` || 'Geen baan'}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        {match.score_team1 !== undefined && match.score_team2 !== undefined
                          ? `${match.score_team1} - ${match.score_team2}`
                          : 'Geen score'}
                      </div>
                    </div>

                    {/* Specials */}
                    {specialsPerMatch[match.id]?.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <div className="mt-2">
                          <strong>Specials:</strong>
                          <ul className="mt-1 list-disc list-inside space-y-1">
                            {specialsPerMatch[match.id].map((special, i) => {
                              const type = specialTypes.find(t => t.id === special.special_type_id);
                              if (!type) return null;
                              return (
                                <li key={i}>
                                  Speler {special.player_id}: {type.name} × {special.count}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nog geen voltooide wedstrijden voor dit toernooi.{' '}
                <Button 
                  variant="link" 
                  className="p-0 ml-1 h-auto"
                  onClick={() => navigate(`/matches?tournament=${selectedTournamentId}`)}
                >
                  Ga naar Wedstrijden om scores in te voeren
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
