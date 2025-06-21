
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
}

export function useDashboardTournaments() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
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
