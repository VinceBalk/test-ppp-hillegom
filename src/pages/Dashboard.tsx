
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
}

interface PlayerWithTrend extends Player {
  trend: 'up' | 'down' | 'same';
}

export default function Dashboard() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [leftRankings, setLeftRankings] = useState<PlayerWithTrend[]>([]);
  const [rightRankings, setRightRankings] = useState<PlayerWithTrend[]>([]);
  const [stats, setStats] = useState({
    activeTournaments: 0,
    totalPlayers: 0,
    matchesToday: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      console.error('Fout bij laden dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      // Fetch current tournament
      const { data: current, error: currentError } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_players!inner(id)
        `)
        .in('status', ['open', 'in_progress'])
        .order('start_date', { ascending: true })
        .limit(1);

      if (currentError) {
        console.error('Error fetching current tournament:', currentError);
      } else if (current && current.length > 0) {
        const t = current[0];
        setCurrentTournament({
          ...t,
          player_count: t.tournament_players?.length || 0
        });
      }

      // Fetch recent tournaments
      const { data: recent, error: recentError } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_players!inner(id)
        `)
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(3);

      if (recentError) {
        console.error('Error fetching recent tournaments:', recentError);
      } else if (recent) {
        setRecentTournaments(
          recent.map(t => ({
            ...t,
            player_count: t.tournament_players?.length || 0
          }))
        );
      }
    } catch (error) {
      console.error('Error in fetchTournaments:', error);
    }
  };

  const fetchPlayerRankings = async () => {
    try {
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .order('ranking_score', { ascending: false });

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      if (!players) return;

      const addTrend = (p: Player, index: number): PlayerWithTrend => ({
        ...p,
        position: index + 1,
        trend: p.rank_change > 0 ? 'up' : p.rank_change < 0 ? 'down' : 'same'
      });

      const leftPlayers = players.filter(p => p.row_side === 'left');
      const rightPlayers = players.filter(p => p.row_side === 'right');

      setLeftRankings(leftPlayers.map(addTrend).slice(0, 10));
      setRightRankings(rightPlayers.map(addTrend).slice(0, 10));
    } catch (error) {
      console.error('Error in fetchPlayerRankings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [tournamentsResult, playersResult, matchesResult] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
      ]);

      if (tournamentsResult.error) console.error('Error fetching tournament stats:', tournamentsResult.error);
      if (playersResult.error) console.error('Error fetching player stats:', playersResult.error);
      if (matchesResult.error) console.error('Error fetching match stats:', matchesResult.error);

      setStats({
        activeTournaments: tournamentsResult.count || 0,
        totalPlayers: playersResult.count || 0,
        matchesToday: matchesResult.count || 0
      });
    } catch (error) {
      console.error('Error in fetchStats:', error);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    const size = "h-3 w-3";
    switch (trend) {
      case 'up': return <TrendingUp className={`${size} text-green-500`} />;
      case 'down': return <TrendingDown className={`${size} text-red-500`} />;
      default: return <Minus className={`${size} text-muted-foreground`} />;
    }
  };

  const handlePlayerClick = (playerId: string) => {
    // Navigate to players page with filter or specific player view
    navigate(`/players?highlight=${playerId}`);
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welkom bij het PPP Hillegom toernooi management systeem</p>
      </div>

      {/* Statistieken */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Toernooien</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTournaments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spelers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geplande Wedstrijden</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchesToday}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laatste Toernooi</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">{recentTournaments[0]?.name || 'Geen recent toernooi'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actief Toernooi */}
      <Card className={currentTournament ? "cursor-pointer hover:shadow-md transition-shadow" : ""} 
            onClick={() => currentTournament && navigate(`/tournaments`)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Huidig Toernooi
          </CardTitle>
          <CardDescription>{currentTournament?.name || 'Geen actief toernooi'}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentTournament ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Datum:</span> {format(new Date(currentTournament.start_date), 'dd MMM yyyy', { locale: nl })}
              </p>
              <p className="text-sm">
                <span className="font-medium">Spelers:</span> {currentTournament.player_count || 0}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span> 
                <span className="ml-1 capitalize">{currentTournament.status.replace('_', ' ')}</span>
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Geen actief toernooi beschikbaar</p>
          )}
        </CardContent>
      </Card>

      {/* Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rankings - Linker Rijtje</CardTitle>
            <CardDescription>Top 10 spelers van de linker kant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {leftRankings.length > 0 ? (
              leftRankings.map(p => (
                <div key={p.id} 
                     className="flex justify-between items-center cursor-pointer hover:bg-muted p-2 rounded transition-colors"
                     onClick={() => handlePlayerClick(p.id)}>
                  <span className="font-medium">#{p.position} {p.name}</span>
                  <span className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{p.ranking_score || 0}</span>
                    {getTrendIcon(p.trend)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Geen spelers gevonden</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rankings - Rechter Rijtje</CardTitle>
            <CardDescription>Top 10 spelers van de rechter kant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rightRankings.length > 0 ? (
              rightRankings.map(p => (
                <div key={p.id} 
                     className="flex justify-between items-center cursor-pointer hover:bg-muted p-2 rounded transition-colors"
                     onClick={() => handlePlayerClick(p.id)}>
                  <span className="font-medium">#{p.position} {p.name}</span>
                  <span className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{p.ranking_score || 0}</span>
                    {getTrendIcon(p.trend)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Geen spelers gevonden</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
