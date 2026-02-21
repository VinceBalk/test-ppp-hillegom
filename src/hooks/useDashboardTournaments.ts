import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  current_round?: number;
  total_rounds?: number;
  player_count?: number;
  created_at?: string;
  updated_at?: string;
}

export function useDashboardTournaments() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = async () => {
    try {
      console.log('Dashboard: Fetching tournaments...');
      
      // Huidig toernooi (open of bezig)
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
        console.error('Dashboard: Error fetching current tournament:', currentError);
      } else if (current && current.length > 0) {
        const t = current[0];
        setCurrentTournament({
          ...t,
          player_count: t.tournament_players?.length || 0
        });
      } else {
        setCurrentTournament(null);
      }

      // Recente voltooide toernooien — sorteer op updated_at zodat net-afgeronde bovenaan staat
      const { data: recent, error: recentError } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_players!inner(id)
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (recentError) {
        console.error('Dashboard: Error fetching recent tournaments:', recentError);
      } else if (recent) {
        setRecentTournaments(recent.map(t => ({
          ...t,
          player_count: t.tournament_players?.length || 0
        })));
      }
    } catch (error) {
      console.error('Dashboard: Error in fetchTournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    currentTournament,
    recentTournaments,
    loading,
    refetch: fetchTournaments
  };
}
