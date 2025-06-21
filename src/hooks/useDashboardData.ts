
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
      console.log('Dashboard: Fetching tournaments...');
      
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

      console.log('Dashboard: Current tournament query result:', { current, currentError });

      if (currentError) {
        console.error('Dashboard: Error fetching current tournament:', currentError);
      } else if (current && current.length > 0) {
        const t = current[0];
        const tournament = {
          ...t,
          player_count: t.tournament_players?.length || 0
        };
        console.log('Dashboard: Setting current tournament:', tournament);
        setCurrentTournament(tournament);
      } else {
        console.log('Dashboard: No current tournament found');
        setCurrentTournament(null);
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

      console.log('Dashboard: Recent tournaments query result:', { recent, recentError });

      if (recentError) {
        console.error('Dashboard: Error fetching recent tournaments:', recentError);
      } else if (recent) {
        const tournaments = recent.map(t => ({
          ...t,
          player_count: t.tournament_players?.length || 0
        }));
        console.log('Dashboard: Setting recent tournaments:', tournaments);
        setRecentTournaments(tournaments);
      }
    } catch (error) {
      console.error('Dashboard: Error in fetchTournaments:', error);
    }
  };

  const fetchPlayerRankings = async () => {
    try {
      console.log('Dashboard: Fetching player rankings...');
      
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .order('ranking_score', { ascending: false });

      console.log('Dashboard: Players query result:', { players, error });

      if (error) {
        console.error('Dashboard: Error fetching players:', error);
        return;
      }

      if (!players) {
        console.log('Dashboard: No players data returned');
        return;
      }

      const addTrend = (p: Player, index: number): PlayerWithTrend => ({
        ...p,
        position: index + 1,
        trend: p.rank_change > 0 ? 'up' : p.rank_change < 0 ? 'down' : 'same'
      });

      const leftPlayers = players.filter(p => p.row_side === 'left');
      const rightPlayers = players.filter(p => p.row_side === 'right');

      console.log('Dashboard: Left players count:', leftPlayers.length);
      console.log('Dashboard: Right players count:', rightPlayers.length);

      const leftRankingsData = leftPlayers.map(addTrend).slice(0, 10);
      const rightRankingsData = rightPlayers.map(addTrend).slice(0, 10);

      console.log('Dashboard: Setting left rankings:', leftRankingsData);
      console.log('Dashboard: Setting right rankings:', rightRankingsData);

      setLeftRankings(leftRankingsData);
      setRightRankings(rightRankingsData);
    } catch (error) {
      console.error('Dashboard: Error in fetchPlayerRankings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Dashboard: Fetching stats...');
      
      const [tournamentsResult, playersResult, matchesResult] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
      ]);

      console.log('Dashboard: Stats query results:', {
        tournaments: tournamentsResult,
        players: playersResult,
        matches: matchesResult
      });

      if (tournamentsResult.error) console.error('Dashboard: Error fetching tournament stats:', tournamentsResult.error);
      if (playersResult.error) console.error('Dashboard: Error fetching player stats:', playersResult.error);
      if (matchesResult.error) console.error('Dashboard: Error fetching match stats:', matchesResult.error);

      const statsData = {
        activeTournaments: tournamentsResult.count || 0,
        totalPlayers: playersResult.count || 0,
        matchesToday: matchesResult.count || 0
      };

      console.log('Dashboard: Setting stats:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Dashboard: Error in fetchStats:', error);
    }
  };

  const fetchDashboardData = async () => {
    console.log('Dashboard: Starting to fetch dashboard data...');
    try {
      await Promise.all([
        fetchTournaments(),
        fetchPlayerRankings(),
        fetchStats()
      ]);
      console.log('Dashboard: All data fetched successfully');
    } catch (error) {
      console.error('Dashboard: Error fetching dashboard data:', error);
    } finally {
      console.log('Dashboard: Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Dashboard: useEffect triggered, fetching data...');
    fetchDashboardData();
  }, []);

  console.log('Dashboard: Current state:', {
    loading,
    currentTournament,
    recentTournaments: recentTournaments.length,
    leftRankings: leftRankings.length,
    rightRankings: rightRankings.length,
    stats
  });

  return {
    currentTournament,
    recentTournaments,
    leftRankings,
    rightRankings,
    stats,
    loading
  };
}
