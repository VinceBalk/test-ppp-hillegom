import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerStatistics {
  player_id: string;
  player_name: string;
  total_games_won: number;
  total_games_lost: number;
  total_specials: number;
  total_tournaments: number;
  avg_games_per_tournament: number;
  win_percentage: number;
}

export const usePlayerStatistics = (tournamentId?: string) => {
  return useQuery({
    queryKey: ['player-statistics', tournamentId],
    queryFn: async () => {
      let query = supabase
        .from('player_tournament_stats')
        .select(`
          player_id,
          games_won,
          games_lost,
          tiebreaker_specials_count,
          tournament_id,
          players:player_id (name)
        `);
      
      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching player statistics:', error);
        throw error;
      }
      
      // Aggregate per player
      const playerMap = new Map<string, {
        player_id: string;
        player_name: string;
        total_games_won: number;
        total_games_lost: number;
        total_specials: number;
        tournaments: Set<string>;
      }>();

      data?.forEach((stat: any) => {
        const playerId = stat.player_id;
        
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player_id: playerId,
            player_name: stat.players?.name || 'Onbekend',
            total_games_won: 0,
            total_games_lost: 0,
            total_specials: 0,
            tournaments: new Set(),
          });
        }
        
        const player = playerMap.get(playerId)!;
        player.total_games_won += stat.games_won || 0;
        player.total_games_lost += stat.games_lost || 0;
        player.total_specials += stat.tiebreaker_specials_count || 0;
        player.tournaments.add(stat.tournament_id);
      });
      
      // Calculate averages and convert to final format
      const statistics: PlayerStatistics[] = Array.from(playerMap.values()).map(p => ({
        player_id: p.player_id,
        player_name: p.player_name,
        total_games_won: p.total_games_won,
        total_games_lost: p.total_games_lost,
        total_specials: p.total_specials,
        total_tournaments: p.tournaments.size,
        avg_games_per_tournament: p.tournaments.size > 0 
          ? Number((p.total_games_won / p.tournaments.size).toFixed(1))
          : 0,
        win_percentage: (p.total_games_won + p.total_games_lost) > 0
          ? Number(((p.total_games_won / (p.total_games_won + p.total_games_lost)) * 100).toFixed(1))
          : 0,
      }));

      // Sort by total games won
      return statistics.sort((a, b) => b.total_games_won - a.total_games_won);
    },
    enabled: true,
  });
};
