import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStanding {
  player_id: string;
  player_name: string;
  games_won: number;
  games_lost: number;
  specials_count: number;
  position: number;
}

export const useTournamentStandings = (tournamentId?: string, roundNumber?: number) => {
  return useQuery({
    queryKey: ['tournament-standings', tournamentId, roundNumber],
    queryFn: async () => {
      if (!tournamentId) return [];

      // Fetch player stats for this tournament and round
      let query = supabase
        .from('player_tournament_stats')
        .select(`
          player_id,
          games_won,
          games_lost,
          tiebreaker_specials_count,
          round_number,
          player:players(name)
        `)
        .eq('tournament_id', tournamentId);

      if (roundNumber) {
        query = query.eq('round_number', roundNumber);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tournament standings:', error);
        throw error;
      }

      // Aggregate stats per player (sum across rounds if no specific round)
      const playerMap = new Map<string, PlayerStanding>();

      data?.forEach((stat: any) => {
        const playerId = stat.player_id;
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player_id: playerId,
            player_name: stat.player?.name || 'Onbekend',
            games_won: 0,
            games_lost: 0,
            specials_count: 0,
            position: 0,
          });
        }

        const player = playerMap.get(playerId)!;
        player.games_won += stat.games_won || 0;
        player.games_lost += stat.games_lost || 0;
        player.specials_count += stat.tiebreaker_specials_count || 0;
      });

      // Convert to array and sort by games won, then specials
      const standings = Array.from(playerMap.values()).sort((a, b) => {
        if (b.games_won !== a.games_won) {
          return b.games_won - a.games_won;
        }
        return b.specials_count - a.specials_count;
      });

      // Assign positions
      standings.forEach((standing, index) => {
        standing.position = index + 1;
      });

      return standings;
    },
    enabled: !!tournamentId,
  });
};
