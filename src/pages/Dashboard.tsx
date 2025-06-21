
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
    const { data: current } = await supabase
      .from('tournaments')
      .select('*, tournament_players(count)')
      .in('status', ['open', 'in_progress'])
      .order('start_date', { ascending: true })
      .limit(1);

    if (current && current.length > 0) {
      const t = current[0];
      setCurrentTournament({
        ...t,
        player_count: t.tournament_players?.length || 0
      });
    }

    const { data: recent } = await supabase
      .from('tournaments')
      .select('*, tournament_players(count)')
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(3);

    if (recent) {
      setRecentTournaments(
        recent.map(t => ({
          ...t,
          player_count: t.tournament_players?.length || 0
        }))
      );
    }
  };

  const fetchPlayerRankings = async () => {
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .order('ranking_score', { ascending: false });

    if (!players) return;

    const addTrend = (p: Player, index: number): PlayerWithTrend => ({
      ...p,
      position: index + 1,
      trend: p.rank_change > 0 ? 'up' : p.rank_change < 0 ? 'down' : 'same'
    });

    setLeftRankings(
      players.filter(p => p.row_side === 'left').map(addTrend).slice(0, 10)
    );

    setRightRankings(
      players.filter(p => p.row_side === 'right').map(addTrend).slice(0, 10)
    );
  };

  const fetchStats = async () => {
    const [{ count: tournaments }, { count: players }, { count: matches }] = await Promise.all([
      supabase.from('tournaments').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
    ]);

    setStats({
      activeTournaments: tournaments || 0,
      totalPlayers: players || 0,
      matchesToday: matches || 0
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    const size = "h-3 w-3";
    switch (trend) {
      case 'up': return <TrendingUp className={`${size} text-green-500`} />;
      case 'down': return <TrendingDown className={`${size} text-red-500`} />;
      default: return <Minus className={`${size} text-muted-foreground`} />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gegevens laden...</p>
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
        <Card><CardHeader><CardTitle>Actieve Toernooien</CardTitle></CardHeader><CardContent>{stats.activeTournaments}</CardContent></Card>
        <Card><CardHeader><CardTitle>Spelers</CardTitle></CardHeader><CardContent>{stats.totalPlayers}</CardContent></Card>
        <Card><CardHeader><CardTitle>Geplande wedstrijden</CardTitle></CardHeader><CardContent>{stats.matchesToday}</CardContent></Card>
        <Card><CardHeader><CardTitle>Laatste Toernooi</CardTitle></CardHeader><CardContent>{recentTournaments[0]?.name || '-'}</CardContent></Card>
      </div>

      {/* Actief Toernooi */}
      <Card className="cursor-pointer" onClick={() => currentTournament && navigate(`/tournament/${currentTournament.id}`)}>
        <CardHeader>
          <CardTitle>Huidig Toernooi</CardTitle>
          <CardDescription>{currentTournament?.name || 'Geen actief toernooi'}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentTournament ? (
            <div>
              <p>Datum: {format(new Date(currentTournament.start_date), 'dd MMM yyyy', { locale: nl })}</p>
              <p>Spelers: {currentTournament.player_count}</p>
              <p>Status: {currentTournament.status}</p>
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
          </CardHeader>
          <CardContent className="space-y-2">
            {leftRankings.map(p => (
              <div key={p.id} className="flex justify-between items-center cursor-pointer hover:bg-muted p-2 rounded"
                   onClick={() => navigate(`/players/${p.id}`)}>
                <span>#{p.position} {p.name}</span>
                <span className="flex items-center space-x-1">
                  <span>{p.ranking_score}</span>
                  {getTrendIcon(p.trend)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rankings - Rechter Rijtje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rightRankings.map(p => (
              <div key={p.id} className="flex justify-between items-center cursor-pointer hover:bg-muted p-2 rounded"
                   onClick={() => navigate(`/players/${p.id}`)}>
                <span>#{p.position} {p.name}</span>
                <span className="flex items-center space-x-1">
                  <span>{p.ranking_score}</span>
                  {getTrendIcon(p.trend)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
