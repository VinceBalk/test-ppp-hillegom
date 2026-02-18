import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from './useMatches';

export const usePlayerMatches = (playerId?: string) => {
  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['player-matches', playerId],
    queryFn: async () => {
      if (!playerId) return [];

      console.log('=== FETCHING PLAYER MATCHES ===');
      console.log('Player ID:', playerId);

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(name),
          team1_player1:players!matches_team1_player1_id_fkey(name),
          team1_player2:players!matches_team1_player2_id_fkey(name),
          team2_player1:players!matches_team2_player1_id_fkey(name),
          team2_player2:players!matches_team2_player2_id_fkey(name),
          court:courts(name)
        `)
        .or(`team1_player1_id.eq.${playerId},team1_player2_id.eq.${playerId},team2_player1_id.eq.${playerId},team2_player2_id.eq.${playerId}`)
        .order('match_number', { ascending: true });

      if (error) {
        console.error('Error fetching player matches:', error);
        throw error;
      }

      console.log('Player matches found:', data?.length || 0);
      return data as Match[];
    },
    enabled: !!playerId,
  });

  return {
    matches,
    isLoading,
    error,
  };
};
