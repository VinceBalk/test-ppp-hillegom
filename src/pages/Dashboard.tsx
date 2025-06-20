
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Calendar, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  player_count?: number;
}

interface Player {
  id: string;
  name: string;
  ranking_score: number;
  row_side: string;
  position: number;
  rank_change: number;
  total_tournaments: number;
  total_games_won: number;
  avg_games_per_tournament: number;
}

interface PlayerWithRanking extends Player {
  trend: 'up' | 'down' | 'same';
}

export default function Dashboard() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [leftGroupRankings, setLeftGroupRankings] = useState<PlayerWithRanking[]>([]);
  const [rightGroupRankings, setRightGroupRankings] = useState<PlayerWithRanking[]>([]);
  const [stats, setStats] = useState({
    activeTournaments: 0,
    totalPlayers: 0,
    matchesToday: 0,
    specialEvents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchTournaments(),
        fetchPlayerRankings(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    // Fetch current/upcoming tournament
    const { data: currentData } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_players(count)
      `)
      .in('status', ['open', 'in_progress'])
      .order('start_date', { ascending: true })
      .limit(1);

    if (currentData && currentData.length > 0) {
      const tournament = currentData[0];
      setCurrentTournament({
        ...tournament,
        player_count: tournament.tournament_players?.length || 0
      });
    }

    // Fetch recent tournaments
    const { data: recentData } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_players(count)
      `)
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(3);

    if (recentData) {
      const tournamentsWithCount = recentData.map(tournament => ({
        ...tournament,
        player_count: tournament.tournament_players?.length || 0
      }));
      setRecentTournaments(tournamentsWithCount);
    }
  };

  const fetchPlayerRankings = async () => {
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .order('ranking_score', { ascending: false });

    if (players) {
      const leftGroup = players
        .filter(player => player.row_side === 'left')
        .slice(0, 10)
        .map((player, index) => ({
          ...player,
          position: index + 1,
          trend: player.rank_change > 0 ? 'up' as const : 
                 player.rank_change < 0 ? 'down' as const : 'same' as const
        }));

      const rightGroup = players
        .filter(player => player.row_side === 'right')
        .slice(0, 10)
        .map((player, index) => ({
          ...player,
          position: index + 1,
          trend: player.rank_change > 0 ? 'up' as const : 
                 player.rank_change < 0 ? 'down' as const : 'same' as const
        }));

      setLeftGroupRankings(leftGroup);
      setRightGroupRankings(rightGroup);
    }
  };

  const fetchStats = async () => {
    // Count active tournaments
    const { count: activeTournamentsCount } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);

    // Count total players
    const { count: totalPlayersCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });

    // Count matches today (for demo, we'll use scheduled matches)
    const { count: matchesTodayCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled');

    // Count special events
    const { count: specialEventsCount } = await supabase
      .from('specials')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'active']);

    setStats({
      activeTournaments: activeTournamentsCount || 0,
      totalPlayers: totalPlayersCount || 0,
      matchesToday: matchesTodayCount || 0,
      specialEvents: specialEventsCount || 0
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welkom bij het PPP Hillegom toernooi management systeem
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welkom bij het PPP Hillegom toernooi management systeem
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Toernooien</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTournaments}</div>
            <p className="text-xs text-muted-foreground">
              Open en lopende toernooien
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geregistreerde Spelers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Totaal aantal spelers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geplande Wedstrijden</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchesToday}</div>
            <p className="text-xs text-muted-foreground">
              Nog te spelen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Speciale Evenementen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.specialEvents}</div>
            <p className="text-xs text-muted-foreground">
              Actieve evenementen
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Tournament */}
        <Card>
          <CardHeader>
            <CardTitle>Huidig Toernooi</CardTitle>
            <CardDescription>
              Lopend of aankomend toernooi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentTournament ? (
              <div className="space-y-2">
                <h3 className="font-semibold">{currentTournament.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(currentTournament.start_date), 'dd MMM yyyy', { locale: nl })} - {' '}
                  {format(new Date(currentTournament.end_date), 'dd MMM yyyy', { locale: nl })}
                </p>
                <p className="text-sm">
                  {currentTournament.player_count} spelers ingeschreven
                </p>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {currentTournament.status === 'open' ? 'Open' : 'Bezig'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Geen actief toernooi gevonden
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tournaments */}
        <Card>
          <CardHeader>
            <CardTitle>Recente Toernooien</CardTitle>
            <CardDescription>
              Laatst afgeronde toernooien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTournaments.length > 0 ? (
                recentTournaments.map((tournament) => (
                  <div key={tournament.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{tournament.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tournament.start_date), 'dd MMM yyyy', { locale: nl })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {tournament.player_count} spelers
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Geen recente toernooien gevonden
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player Rankings - Left Group */}
        <Card>
          <CardHeader>
            <CardTitle>Rankings - Links</CardTitle>
            <CardDescription>
              Top spelers linker rij
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leftGroupRankings.length > 0 ? (
                leftGroupRankings.slice(0, 5).map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium w-6">#{player.position}</span>
                      <span className="text-sm">{player.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">
                        {player.ranking_score}
                      </span>
                      {getTrendIcon(player.trend)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Geen spelers in linker rij
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Rankings - Right Group */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings - Rechts</CardTitle>
          <CardDescription>
            Top spelers rechter rij
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {rightGroupRankings.length > 0 ? (
              rightGroupRankings.slice(0, 10).map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium w-6">#{player.position}</span>
                    <span className="text-sm">{player.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">
                      {player.ranking_score}
                    </span>
                    {getTrendIcon(player.trend)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-2">
                Geen spelers in rechter rij
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
