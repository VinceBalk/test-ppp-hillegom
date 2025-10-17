import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { useTournamentStandings } from '@/hooks/useTournamentStandings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ChefSpecialRanking from '@/components/tournaments/ChefSpecialRanking';

export default function TournamentStandings() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  
  const { data: standings = [], isLoading: loadingStandings } = useTournamentStandings(
    tournamentId
  );

  if (loadingTournament || loadingStandings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="outline" onClick={() => navigate('/tournaments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Toernooien
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Toernooi niet gevonden.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group standings by court
  const courtGroups = standings.reduce((acc, player) => {
    const courtName = player.court_name || 'Onbekend';
    if (!acc[courtName]) acc[courtName] = [];
    acc[courtName].push(player);
    return acc;
  }, {} as Record<string, typeof standings>);

  const renderCourtGroup = (courtName: string, players: typeof standings) => {
    if (players.length === 0) return null;
    
    const positionRange = players[0].court_position_range || '';
    
    return (
      <Card key={courtName}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {courtName}
            <Badge variant="secondary" className="text-xs">
              Posities {positionRange}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.player_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  player.position === 1 ? 'bg-yellow-50 border-yellow-200' :
                  player.position === 2 ? 'bg-gray-50 border-gray-200' :
                  player.position === 3 ? 'bg-orange-50 border-orange-200' :
                  'bg-background border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    player.position === 1 ? 'bg-yellow-500 text-white' :
                    player.position === 2 ? 'bg-gray-400 text-white' :
                    player.position === 3 ? 'bg-orange-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {player.position === 1 ? <Trophy className="h-4 w-4" /> : player.position}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{player.player_name}</p>
                    {player.tie_breaker_used && (
                      <p className="text-xs text-muted-foreground">
                        {player.tie_breaker_used === 'r3_specials' && '🎯 R3 Specials'}
                        {player.tie_breaker_used === 'r2_games' && '🔢 R2 Games'}
                        {player.tie_breaker_used === 'r1_games' && '🥉 R1 Games'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-right">
                    <p className="font-bold text-green-600">{player.round3_games_won}</p>
                    <p className="text-xs text-muted-foreground">R3</p>
                  </div>
                  {player.round3_specials > 0 && (
                    <Badge variant="outline" className="ml-1">
                      <Award className="h-3 w-3 mr-1" />
                      {player.round3_specials}
                    </Badge>
                  )}
                  <div className="text-right">
                    <p className="font-medium">{player.round2_games_won}</p>
                    <p className="text-xs text-muted-foreground">R2</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{player.round1_games_won}</p>
                    <p className="text-xs text-muted-foreground">R1</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/tournaments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground">Eindstand (Ronde 3 Primair)</p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">🏆 Finalegroepen</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Gerankt op basis van R3 prestaties binnen elke baan
          </p>
        </div>

        {standings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-4">
                Nog geen statistieken beschikbaar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(courtGroups).map(([courtName, players]) =>
              renderCourtGroup(courtName, players)
            )}
          </div>
        )}

        <ChefSpecialRanking 
          tournamentId={tournamentId!} 
          title="Chef Special Ranking"
        />
      </div>
    </div>
  );
}
