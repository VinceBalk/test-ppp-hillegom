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

  const renderStandingsCard = (
    title: string, 
    showTrend: boolean = false,
    description?: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nog geen statistieken beschikbaar.
          </p>
        ) : (
          <div className="space-y-2">
            {standings.map((player, index) => (
              <div
                key={player.player_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-background border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index === 0 ? <Trophy className="h-4 w-4" /> : player.position}
                  </div>
                  
                  {showTrend && player.trend && (
                    <div className="flex items-center justify-center w-6 h-6">
                      {player.trend === 'up' && (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      )}
                      {player.trend === 'down' && (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      {player.trend === 'same' && (
                        <Minus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{player.player_name}</p>
                    {showTrend && player.position_change !== undefined && player.position_change !== 0 && (
                      <p className="text-xs text-muted-foreground">
                        {player.position_change > 0 ? `+${player.position_change}` : player.position_change} positie{Math.abs(player.position_change) !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-right">
                    <p className="font-bold text-green-600">{player.round3_games_won}</p>
                    <p className="text-xs text-muted-foreground">R3 games</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{player.round2_games_won}</p>
                    <p className="text-xs text-muted-foreground">R2 games</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{player.round1_games_won}</p>
                    <p className="text-xs text-muted-foreground">R1 games</p>
                  </div>
                  {player.round3_specials > 0 && (
                    <Badge variant="outline" className="ml-2">
                      <Award className="h-3 w-3 mr-1" />
                      {player.round3_specials}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

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
        {renderStandingsCard(
          'Finale Ranking', 
          false,
          'Gerankt op basis van Ronde 3 prestaties, met tie-breakers van R3 specials, R2 games, en R1 games'
        )}
        <ChefSpecialRanking 
          tournamentId={tournamentId!} 
          title="Chef Special Ranking"
        />
      </div>
    </div>
  );
}
