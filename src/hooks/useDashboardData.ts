
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface DashboardStats {
  activeTournaments: number;
  totalPlayers: number;
  matchesToday: number;
}

export function useDashboardData() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [leftRankings, setLeftRankings] = useState<PlayerWithTrend[]>([]);
  const [rightRankings, setRightRankings] = useState<PlayerWithTrend[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeTournaments: 0,
    totalPlayers: 0,
    matchesToday: 0
  });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    currentTournament,
    recentTournaments,
    leftRankings,
    rightRankings,
    stats,
    loading
  };
}
