
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function useDashboardPlayerRankings() {
  const [leftRankings, setLeftRankings] = useState<PlayerWithTrend[]>([]);
  const [rightRankings, setRightRankings] = useState<PlayerWithTrend[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerRankings();
  }, []);

  return {
    leftRankings,
    rightRankings,
    loading,
    refetch: fetchPlayerRankings
  };
}
