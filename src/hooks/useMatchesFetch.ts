
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from './useMatches';

export const useMatchesFetch = (tournamentId?: string) => {
  return useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      console.log('=== FETCHING MATCHES START ===');
      console.log('Tournament ID:', tournamentId);
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user in fetch:', user?.email || 'No user');
      console.log('User error:', userError);
      
      if (userError) {
        console.error('User authentication error:', userError);
        throw new Error('Authentication required');
      }
      
      if (!user) {
        console.error('No user found in matches fetch');
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(name),
          player1:players!matches_player1_id_fkey(name),
          player2:players!matches_player2_id_fkey(name),
          team1_player1:players!matches_team1_player1_id_fkey(name),
          team1_player2:players!matches_team1_player2_id_fkey(name),
          team2_player1:players!matches_team2_player1_id_fkey(name),
          team2_player2:players!matches_team2_player2_id_fkey(name),
          court:courts(name)
        `);

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      console.log('Executing matches query...');
      const { data, error } = await query;
      
      if (error) {
        console.error('=== MATCHES QUERY ERROR ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }
      
      console.log('=== MATCHES QUERY SUCCESS ===');
      console.log('Raw data from database:', data);
      console.log('Number of matches found:', data?.length || 0);
      
      // Add detailed logging for each match
      if (data && data.length > 0) {
        data.forEach((match, index) => {
          console.log(`Match ${index + 1}:`, {
            id: match.id,
            tournament_id: match.tournament_id,
            team1_player1: match.team1_player1?.name,
            team1_player2: match.team1_player2?.name,
            team2_player1: match.team2_player1?.name,
            team2_player2: match.team2_player2?.name,
            court: match.court?.name,
            court_number: match.court_number,
            status: match.status,
            created_at: match.created_at
          });
        });
      }
      
      return data as Match[];
    },
    enabled: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh data
  });
};
