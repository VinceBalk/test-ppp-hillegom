
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  activeTournaments: number;
  totalPlayers: number;
  matchesToday: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    activeTournaments: 0,
    totalPlayers: 0,
    matchesToday: 0
  });
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
}
