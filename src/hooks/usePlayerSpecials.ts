import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerSpecialStats {
  total_specials: number;
  tournaments_count: number;
  chef_special_titles: number;
  sous_chef_titles: number;
  year_rank: number;
}

export const usePlayerSpecials = (playerId: string, year: number) => {
  return useQuery({
    queryKey: ['player-specials', playerId, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_specials_by_year', {
        p_player_id: playerId,
        p_year: year
      });

      if (error) {
        console.error('Error fetching player specials:', error);
        throw error;
      }

      return data?.[0] as PlayerSpecialStats || {
        total_specials: 0,
        tournaments_count: 0,
        chef_special_titles: 0,
        sous_chef_titles: 0,
        year_rank: 999
      };
    },
    enabled: !!playerId,
  });
};
