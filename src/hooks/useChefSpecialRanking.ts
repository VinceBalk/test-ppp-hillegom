import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChefSpecialRanking {
  player_id: string;
  player_name: string;
  total_specials: number;
  rank_position: number;
  title: 'Chef Special' | 'Sous Chef' | null;
}

export const useChefSpecialRanking = (tournamentId?: string, roundNumber?: number) => {
  return useQuery({
    queryKey: ['chef-special-ranking', tournamentId, roundNumber],
    queryFn: async () => {
      if (!tournamentId) return [];

      const { data, error } = await supabase.rpc('get_tournament_specials_ranking', {
        p_tournament_id: tournamentId,
        p_round_number: roundNumber || null
      });

      if (error) {
        console.error('Error fetching chef special ranking:', error);
        throw error;
      }

      return data as ChefSpecialRanking[];
    },
    enabled: !!tournamentId,
  });
};
