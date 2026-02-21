import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, TrendingDown, Calendar, Users, Award, ChefHat, ArrowRight } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import { usePlayers } from '@/hooks/usePlayers';
import { useChefSpecialRanking } from '@/hooks/useChefSpecialRanking';
import { CurrentTournament } from '@/components/dashboard/CurrentTournament';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentTournament,
    recentTournaments,
    stats,
    loading: dashboardLoading
  } = useDashboardData();

  const { data: rankings, isLoading: rankingsLoading } = usePlayerRankings();
  const { players, isLoading: playersLoading } = usePlayers();
  
  const lastTournament = recentTournaments[0];
  const { data: chefRankings, isLoading: chefLoading } = useChefSpecialRanking(lastTournament?.id);

  // Winnaar van het laatste toernooi ophalen uit tournament standings (positie 1)
  const [lastTournamentWinner, setLastTournamentWinner] = useState<{ player_id: string; name: string } | null>(null);

  useEffect(() => {
    if (!lastTournament?.id) {
      setLastTournamentWinner(null);
      return;
    }
    
    const fetchWinner = async () => {
      // Haal de #1 positie op uit player_tournament_stats voor dit toernooi
      // We kijken naar de speler met de meeste R3 games won (positie 1 = baan 1 top)
      // Gebruik de standings logica: hoogste R3 score op de top-baan
      const { data, error } = await supabase
        .from('player_tournament_stats')
        .select(`
          player_id,
          games_won,
          round_number,
          players:player_id(id, name)
        `)
        .eq('tournament_id', lastTournament.id)
        .eq('round_number', 3)
        .order('games_won', { ascending: false })
        .limit(8);

      if (error || !data || data.length === 0) {
        // Fallback: overall ranking #1
        if (rankings && rankings.length > 0) {
          setLastTournamentWinner({ player_id: rankings[0].player_id, name: rankings[0].name });
        }
        return;
      }

      // Winnaar is de speler op positie 1 (Links-Top baan 1 of vergelijkbaar)
      // Haal de wedstrijden op voor R3 om te weten welke spelers in de top baan speelden
      const { data: r3Matches, error: r3Error } = await supabase
        .from('matches')
        .select(`
          team1_player1_id,
          team1_player2_id,
          team2_player1_id,
          team2_player2_id,
          score_team1,
          score_team2,
          court:courts(name, menu_order, row_side)
        `)
        .eq('tournament_id', lastTournament.id)
        .eq('round_number', 3)
        .order('court_id', { ascending: true });

      if (r3Error || !r3Matches || r3Matches.length === 0) {
        // Fallback naar hoogste R3 games won
        const topStat = data[0] as any;
        setLastTournamentWinner({
          player_id: topStat.player_id,
          name: topStat.players?.name || 'Onbekend'
        });
        return;
      }

      // Vind de top baan (laagste menu_order aan de linker kant = baan 1 links)
      const leftCourts = (r3Matches as any[])
        .map(m => m.court)
        .filter(c => c && c.row_side === 'left')
        .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));

      const topCourtName = leftCourts[0]?.name;

      // Spelers die op de top baan speelden
      const topCourtMatches = (r3Matches as any[]).filter(m => m.court?.name === topCourtName);
      
      if (topCourtMatches.length === 0) {
        const topStat = data[0] as any;
        setLastTournamentWinner({
          player_id: topStat.player_id,
          name: topStat.players?.name || 'Onbekend'
        });
        return;
      }

      const topCourtPlayerIds = new Set<string>();
      topCourtMatches.forEach((m: any) => {
        if (m.team1_player1_id) topCourtPlayerIds.add(m.team1_player1_id);
        if (m.team1_player2_id) topCourtPlayerIds.add(m.team1_player2_id);
        if (m.team2_player1_id) topCourtPlayerIds.add(m.team2_player1_id);
        if (m.team2_player2_id) topCourtPlayerIds.add(m.team2_player2_id);
      });

      // Vind de winnaar: speler op top baan met hoogste R3 games won
      const topCourtStats = (data as any[]).filter(s => topCourtPlayerIds.has(s.player_id));
      
      if (topCourtStats.length > 0) {
        const winner = topCourtStats[0];
        setLastTournamentWinner({
          player_id: winner.player_id,
          name: winner.players?.name || 'Onbekend'
        });
      } else {
        const topStat = data[0] as any;
        setLastTournamentWinner({
          player_id: topStat.player_id,
          name: topStat.players?.name || 'Onbekend'
        });
      }
    };

    fetchWinner();
  }, [lastTournament?.id, rankings]);

  const loading = dashboardLoading || rankingsLoading || playersLoading || chefLoading;

  const leftTop3 = rankings?.filter(r => r.row_side === 'left').slice(0, 3) || [];
  const rightTop3 = rankings?.filter(r => r.row_side === 'right').slice(0, 3) || [];

  const chefSpecial = chefRankings?.find(r => r.title === 'Chef Special');
  const sousChef = chefRankings?.find(r => r.title === 'Sous Chef');

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

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="text-3xl font-bold mb-1">{currentTournament.name}</div>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentTournament.start_date).toLocaleDateString('nl-NL', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Geen gepland</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              Totaal Spelers
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.totalPlayers}</div>
            <p className="text-sm text-muted-foreground">Actieve spelers</p>
          </CardContent>
        </Card>
      </div>

      {/* Laatste Toernooi Row */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Trophy className="h-4 w-4" />
            Laatste Toernooi
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Toernooi Info */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-lg">
              <div className="flex-1">
                {lastTournament ? (
                  <>
                    <div className="text-lg font-bold">{lastTournament.name}</div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lastTournament.start_date).toLocaleDateString('nl-NL', { 
                        day: 'numeric', 
                        month: 'long'
                      })}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Geen data</div>
                )}
              </div>
            </div>

            {/* Winnaar */}
            <div 
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => lastTournamentWinner && navigate(`/players/${lastTournamentWinner.player_id}`)}
            >
              <Trophy className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-green-700 mb-0.5">Winnaar</div>
                {lastTournamentWinner ? (
                  <div className="text-base font-bold text-green-900 truncate">{lastTournamentWinner.name}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nog niet beschikbaar</div>
                )}
              </div>
            </div>

            {/* Chef Special */}
            <div 
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => chefSpecial && navigate(`/players/${chefSpecial.player_id}`)}
            >
              <ChefHat className="h-8 w-8 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-orange-700 mb-0.5">Chef Special</div>
                {chefSpecial ? (
                  <>
                    <div className="text-base font-bold text-orange-900 truncate">{chefSpecial.player_name}</div>
                    <div className="text-sm text-orange-700">{chefSpecial.total_specials} specials</div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Nog niet toegekend</div>
                )}
              </div>
            </div>

            {/* Sous Chef */}
            <div 
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => sousChef && navigate(`/players/${sousChef.player_id}`)}
            >
              <Award className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-amber-700 mb-0.5">Sous Chef</div>
                {sousChef ? (
                  <>
                    <div className="text-base font-bold text-amber-900 truncate">{sousChef.player_name}</div>
                    <div className="text-sm text-amber-700">{sousChef.total_specials} specials</div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Nog niet toegekend</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Tournament */}
      {currentTournament && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <CardTitle>Huidig Toernooi</CardTitle>
            </div>
            <CardDescription>{currentTournament.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Datum:</span>
                <span className="text-sm">{new Date(currentTournament.start_date).toLocaleDateString('nl-NL', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Spelers:</span>
                <span className="text-sm">{currentTournament.max_players || 16}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={currentTournament.status === 'completed' ? 'default' : 'secondary'}>
                  {currentTournament.status === 'open' ? 'Open' : 
                   currentTournament.status === 'in_progress' ? 'Bezig' : 'Voltooid'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Ronde:</span>
                <span className="text-sm">{currentTournament.current_round || 1} van 3</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => navigate('/tournaments')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Bekijk Schema
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top 3 - Links
                </CardTitle>
                <CardDescription>Beste spelers linker rij</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/statistics')}
              >
                Alle rankings
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leftTop3.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Geen data beschikbaar</p>
            ) : (
              <div className="space-y-3">
                {leftTop3.map((player, index) => (
                  <div 
                    key={player.player_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/players/${player.player_id}`)}
                  >
                    <span className="text-xl w-8 text-center">{renderMedal(index)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Ø Positie: {player.avg_position} · {player.tournaments_played} toernooien
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top 3 - Rechts
                </CardTitle>
                <CardDescription>Beste spelers rechter rij</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/statistics')}
              >
                Alle rankings
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rightTop3.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Geen data beschikbaar</p>
            ) : (
              <div className="space-y-3">
                {rightTop3.map((player, index) => (
                  <div 
                    key={player.player_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/players/${player.player_id}`)}
                  >
                    <span className="text-xl w-8 text-center">{renderMedal(index)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Ø Positie: {player.avg_position} · {player.tournaments_played} toernooien
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
        {/* Links Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">Links</Badge>
              Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const leftPlayers = players.filter(p => p.row_side === 'left' && p.rank_change !== undefined);
              const leftRisers = leftPlayers.filter(p => (p.rank_change || 0) > 0).sort((a, b) => (b.rank_change || 0) - (a.rank_change || 0));
              const leftFallers = leftPlayers.filter(p => (p.rank_change || 0) < 0).sort((a, b) => (a.rank_change || 0) - (b.rank_change || 0));
              
              const topRiseValue = leftRisers[0]?.rank_change;
              const topRisers = leftRisers.filter(p => p.rank_change === topRiseValue);
              
              const topFallValue = leftFallers[0]?.rank_change;
              const topFallers = leftFallers.filter(p => p.rank_change === topFallValue);

              return (
                <>
                  <div className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-background rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Grootste Stijger{topRisers.length > 1 ? 's' : ''}
                    </div>
                    {topRisers.length > 0 ? (
                      <div className="space-y-2">
                        {topRisers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => navigate(`/players/${player.id}`)}
                            className="flex items-center justify-between cursor-pointer hover:bg-white/50 rounded p-2 transition-colors"
                          >
                            <p className="font-semibold text-base">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                              <span className="text-xl font-bold text-green-600">+{player.rank_change}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data</p>
                    )}
                  </div>

                  <div className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-background rounded-lg p-4">
                    <div className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Grootste Daler{topFallers.length > 1 ? 's' : ''}
                    </div>
                    {topFallers.length > 0 ? (
                      <div className="space-y-2">
                        {topFallers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => navigate(`/players/${player.id}`)}
                            className="flex items-center justify-between cursor-pointer hover:bg-white/50 rounded p-2 transition-colors"
                          >
                            <p className="font-semibold text-base">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-5 w-5 text-red-600" />
                              <span className="text-xl font-bold text-red-600">{player.rank_change}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data</p>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Rechts Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">Rechts</Badge>
              Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const rightPlayers = players.filter(p => p.row_side === 'right' && p.rank_change !== undefined);
              const rightRisers = rightPlayers.filter(p => (p.rank_change || 0) > 0).sort((a, b) => (b.rank_change || 0) - (a.rank_change || 0));
              const rightFallers = rightPlayers.filter(p => (p.rank_change || 0) < 0).sort((a, b) => (a.rank_change || 0) - (b.rank_change || 0));
              
              const topRiseValue = rightRisers[0]?.rank_change;
              const topRisers = rightRisers.filter(p => p.rank_change === topRiseValue);
              
              const topFallValue = rightFallers[0]?.rank_change;
              const topFallers = rightFallers.filter(p => p.rank_change === topFallValue);

              return (
                <>
                  <div className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-background rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Grootste Stijger{topRisers.length > 1 ? 's' : ''}
                    </div>
                    {topRisers.length > 0 ? (
                      <div className="space-y-2">
                        {topRisers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => navigate(`/players/${player.id}`)}
                            className="flex items-center justify-between cursor-pointer hover:bg-white/50 rounded p-2 transition-colors"
                          >
                            <p className="font-semibold text-base">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                              <span className="text-xl font-bold text-green-600">+{player.rank_change}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data</p>
                    )}
                  </div>

                  <div className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-background rounded-lg p-4">
                    <div className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Grootste Daler{topFallers.length > 1 ? 's' : ''}
                    </div>
                    {topFallers.length > 0 ? (
                      <div className="space-y-2">
                        {topFallers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => navigate(`/players/${player.id}`)}
                            className="flex items-center justify-between cursor-pointer hover:bg-white/50 rounded p-2 transition-colors"
                          >
                            <p className="font-semibold text-base">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-5 w-5 text-red-600" />
                              <span className="text-xl font-bold text-red-600">{player.rank_change}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data</p>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
