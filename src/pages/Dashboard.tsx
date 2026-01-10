import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Calendar, Users, Award, ChefHat } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import { usePlayers } from '@/hooks/usePlayers';
import { CurrentTournament } from '@/components/dashboard/CurrentTournament';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentTournament,
    recentTournaments,
    stats,
    chefSpecial,
    sousChef,
    loading: dashboardLoading
  } = useDashboardData();

  const { data: rankings, isLoading: rankingsLoading } = usePlayerRankings();
  const { players, isLoading: playersLoading } = usePlayers();

  const loading = dashboardLoading || rankingsLoading || playersLoading;

  // Get top 3 per side
  const leftTop3 = rankings?.filter(r => r.row_side === 'left').slice(0, 3) || [];
  const rightTop3 = rankings?.filter(r => r.row_side === 'right').slice(0, 3) || [];

  // Get biggest mover (positive = improved position = lower number)
  const playersWithChange = players
    .filter(p => p.rank_change && p.rank_change !== 0)
    .sort((a, b) => (b.rank_change || 0) - (a.rank_change || 0));
  
  const biggestRiser = playersWithChange[0];
  const biggestFaller = playersWithChange[playersWithChange.length - 1];

  const lastTournament = recentTournaments[0];
  const lastTournamentWinner = rankings?.find(r => rankings.indexOf(r) === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  const renderMedal = (index: number) => {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[index] || `#${index + 1}`;
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welkom bij het PPP Hillegom toernooi management systeem</p>
      </div>

      {/* Stats Row - Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Aankomend Toernooi */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/tournaments')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              Aankomend Toernooi
            </div>
          </CardHeader>
          <CardContent>
            {currentTournament ? (
              <>
                <div className="text-lg font-bold mb-1">{currentTournament.name}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(currentTournament.start_date).toLocaleDateString('nl-NL', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Geen gepland</div>
            )}
          </CardContent>
        </Card>

        {/* Laatste Toernooi */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Trophy className="h-4 w-4" />
              Laatste Toernooi
            </div>
          </CardHeader>
          <CardContent>
            {lastTournament ? (
              <>
                <div className="text-lg font-bold mb-1">{lastTournament.name}</div>
                <p className="text-xs text-muted-foreground">
                  Winnaar: {lastTournamentWinner?.name || 'N/A'}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Geen data</div>
            )}
          </CardContent>
        </Card>

        {/* Chef Special */}
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-background">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700 mb-2">
              <ChefHat className="h-4 w-4" />
              Chef Special
            </div>
          </CardHeader>
          <CardContent>
            {chefSpecial ? (
              <>
                <div className="text-lg font-bold text-orange-700 mb-1">{chefSpecial.player_name}</div>
                <p className="text-xs text-muted-foreground">{chefSpecial.total_specials} specials</p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Nog niet toegekend</div>
            )}
          </CardContent>
        </Card>

        {/* Sous Chef */}
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-background">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 mb-2">
              <Award className="h-4 w-4" />
              Sous Chef
            </div>
          </CardHeader>
          <CardContent>
            {sousChef ? (
              <>
                <div className="text-lg font-bold text-amber-700 mb-1">{sousChef.player_name}</div>
                <p className="text-xs text-muted-foreground">{sousChef.total_specials} specials</p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Nog niet toegekend</div>
            )}
          </CardContent>
        </Card>

        {/* Totaal Spelers */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              Totaal Spelers
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Actieve spelers</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Tournament */}
      <CurrentTournament 
        tournament={currentTournament} 
        onTournamentClick={() => navigate('/tournaments')} 
      />

      {/* Top 3 Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 3 - Links
            </CardTitle>
            <CardDescription>Beste spelers linker rij</CardDescription>
          </CardHeader>
          <CardContent>
            {leftTop3.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Geen rankings beschikbaar</p>
            ) : (
              <div className="space-y-4">
                {leftTop3.map((player, index) => (
                  <div
                    key={player.player_id}
                    onClick={() => navigate(`/players/${player.player_id}`)}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border"
                  >
                    <span className="text-3xl">{renderMedal(index)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">{player.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Ø Positie: {player.avg_position}</span>
                        <span>•</span>
                        <span>{player.tournaments_played} toernooien</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{player.total_games_won}</div>
                      <div className="text-xs text-muted-foreground">games</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 3 - Rechts
            </CardTitle>
            <CardDescription>Beste spelers rechter rij</CardDescription>
          </CardHeader>
          <CardContent>
            {rightTop3.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Geen rankings beschikbaar</p>
            ) : (
              <div className="space-y-4">
                {rightTop3.map((player, index) => (
                  <div
                    key={player.player_id}
                    onClick={() => navigate(`/players/${player.player_id}`)}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border"
                  >
                    <span className="text-3xl">{renderMedal(index)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">{player.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Ø Positie: {player.avg_position}</span>
                        <span>•</span>
                        <span>{player.tournaments_played} toernooien</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{player.total_games_won}</div>
                      <div className="text-xs text-muted-foreground">games</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Grootste Stijger
            </CardTitle>
            <CardDescription>Meeste posities vooruitgegaan</CardDescription>
          </CardHeader>
          <CardContent>
            {biggestRiser ? (
              <div
                onClick={() => navigate(`/players/${biggestRiser.id}`)}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-semibold text-xl">{biggestRiser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {biggestRiser.group_side === 'left' ? 'Links' : 'Rechts'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold text-green-600">
                    +{biggestRiser.rank_change}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Geen data beschikbaar
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Grootste Daler
            </CardTitle>
            <CardDescription>Meeste posities achteruitgegaan</CardDescription>
          </CardHeader>
          <CardContent>
            {biggestFaller ? (
              <div
                onClick={() => navigate(`/players/${biggestFaller.id}`)}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-semibold text-xl">{biggestFaller.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {biggestFaller.group_side === 'left' ? 'Links' : 'Rechts'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <span className="text-3xl font-bold text-red-600">
                    {biggestFaller.rank_change}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Geen data beschikbaar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
