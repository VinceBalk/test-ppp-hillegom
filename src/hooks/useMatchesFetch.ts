import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from './useMatches';

export const useMatchesFetch = (tournamentId?: string) => {
  return useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      console.log('=== FETCHING MATCHES START ===');
      console.log('Tournament ID:', tournamentId);

      let query = supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(id, name, status, is_simulation, start_date),
          team1_player1:players!matches_team1_player1_id_fkey(name),
          team1_player2:players!matches_team1_player2_id_fkey(name),
          team2_player1:players!matches_team2_player1_id_fkey(name),
          team2_player2:players!matches_team2_player2_id_fkey(name),
          court:courts(name, menu_order, background_color, row_side),
          match_specials:match_specials(
            id,
            player_id,
            special_type_id,
            count,
            player:players(name),
            special_type:special_types(name)
          )
        `);

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('=== MATCHES QUERY ERROR ===');
        console.error('Error:', error);
        throw error;
      }

      console.log('=== MATCHES QUERY SUCCESS ===');
      console.log('Aantal matches:', data?.length || 0);

      return data as Match[];
    },
    enabled: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};
